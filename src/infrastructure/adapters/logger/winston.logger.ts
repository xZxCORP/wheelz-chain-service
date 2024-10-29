import winston from 'winston';

import type { LoggerPort } from '../../../application/ports/logger.port.js';

export class WinstonLogger implements LoggerPort {
  private logger: winston.Logger;

  constructor(options: { logLevel: string; pretty?: boolean; logFile?: string }) {
    const { logLevel, pretty = true, logFile } = options;

    const formats = [
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
      winston.format.colorize(),
    ];

    if (pretty) {
      formats.push(
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          let message_ = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(metadata).length > 0) {
            message_ += ` ${JSON.stringify(metadata, undefined, 2)}`;
          }
          return message_;
        })
      );
    }

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(...formats),
      }),
    ];

    if (logFile) {
      transports.push(
        new winston.transports.File({
          filename: logFile,
          format: winston.format.combine(...formats),
        })
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      transports,
    });
  }

  private log(level: string, message: string, ...meta: any[]): void {
    if (meta.length === 0) {
      this.logger.log(level, message);
    } else if (meta.length === 1 && typeof meta[0] === 'object') {
      this.logger.log(level, message, meta[0]);
    } else {
      this.logger.log(level, message, meta);
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
