import { spawn, type ChildProcess } from 'node:child_process';
import { createInterface } from 'node:readline';
import { ConflictError } from '../config.js';
import { status, type Mode } from './telemetry.service.js';

export interface CommandSpec {
  file: string;
  args: string[];
  onLine?: (line: string) => void;
}

export interface ScenarioOptions {
  commands?: CommandSpec[];
}

interface Scenario {
  mode: Mode;
  state: 'RUNNING' | 'STOPPING';
  durationSec: number;
  startedAt: number;
  timer: NodeJS.Timeout;
  children: ChildProcess[];
}

export class ProcessManager {
  private jobs = new Map<Mode, Scenario>();

  start(mode: Mode, durationSec: number, options: ScenarioOptions = {}) {
    if (this.jobs.has(mode)) {
      throw new ConflictError(`${mode} is already running`);
    }

    const job = {
      mode,
      state: 'RUNNING',
      durationSec,
      startedAt: Date.now(),
      children: []
    } as unknown as Scenario;

    this.jobs.set(mode, job);
    job.timer = setTimeout(() => this.stop(mode, 'duration_elapsed'), durationSec * 1000 + 50);

    try {
      for (const command of options.commands ?? []) {
        this.launch(job, command);
      }
    } catch (error) {
      this.fail(mode, (error as Error).message);
      throw error;
    }

    status(mode, 'RUNNING', `[${mode}] Đã bắt đầu trong mạng lab cyber_net`, { durationSec });
    return { status: 'started', mode, durationSec, labRestricted: true };
  }

  private launch(job: Scenario, command: CommandSpec) {
    const child = spawn(command.file, command.args, {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    job.children.push(child);

    const lines = createInterface({ input: child.stdout! });
    lines.on('line', line => {
      try {
        command.onLine?.(line);
      } catch (error) {
        console.error(`[${job.mode}] Không đọc được output: ${(error as Error).message}`);
        this.fail(job.mode, (error as Error).message);
      }
    });

    child.stderr!.on('data', chunk => {
      const message = String(chunk).trim();
      if (message) console.error(`[${job.mode}] ${message}`);
    });
    child.once('error', error => this.fail(job.mode, error.message));
    child.once('close', (code, signal) => {
      lines.close();
      const current = this.jobs.get(job.mode);
      if (current && current.state !== 'STOPPING') {
        this.fail(job.mode, `worker exited (${code ?? signal ?? 'unknown'})`);
      }
    });
  }

  snapshot() {
    return [...this.jobs.values()].map(({ mode, state, startedAt, durationSec }) => {
      const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
      return {
        mode,
        state,
        startedAt,
        durationSec,
        elapsedSec,
        remainingSec: Math.max(0, durationSec - elapsedSec),
        labRestricted: true
      };
    });
  }

  stop(mode: Mode, reason = 'requested') {
    const job = this.jobs.get(mode);
    if (!job) return { status: 'not_running', mode, labRestricted: true };

    job.state = 'STOPPING';
    clearTimeout(job.timer);

    for (const child of job.children) {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    }
    setTimeout(() => {
      for (const child of job.children) {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }
    }, 2000).unref();

    this.jobs.delete(mode);
    const state = reason.startsWith('failed:') ? 'FAILED' : 'STOPPED';
    status(mode, state, `[${mode}] ${reason}`);
    return { status: state.toLowerCase(), mode, labRestricted: true };
  }

  fail(mode: Mode, reason: string) {
    return this.stop(mode, `failed: ${reason}`);
  }

  stopAll() {
    for (const mode of [...this.jobs.keys()]) this.stop(mode, 'stop_all');
  }
}

export const processes = new ProcessManager();
