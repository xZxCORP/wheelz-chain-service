/* eslint-disable @typescript-eslint/no-explicit-any */
import pino from 'pino';

import type { LoggerPort } from '../../../application/ports/logger.port.js';

export class PinoLogger implements LoggerPort {
  private logger: pino.Logger;

  constructor(logLevel: string) {
    this.logger = pino.pino({
      level: logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }
  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...meta: any[]): void {
    if (meta.length === 0) {
      this.logger[level](message);
    } else if (meta.length === 1) {
      this.logger[level](meta[0], message);
    } else {
      this.logger[level]({ meta }, message);
    }
  }

  debug(message: string, ...meta: any[]): void {
    this.log('debug', message, ...meta);
  }

  info(message: string, ...meta: any[]): void {
    this.log('info', message, ...meta);
  }

  warn(message: string, ...meta: any[]): void {
    this.log('warn', message, ...meta);
  }

  error(message: string, ...meta: any[]): void {
    this.log('error', message, ...meta);
  }
}
