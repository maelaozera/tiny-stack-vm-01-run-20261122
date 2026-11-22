# Tiny Stack VM

A tiny stack virtual machine for make.fun's tiny stack ISA v1. One Node 22
program runs every `program.bin` + `input.bin` instance and answers with
exactly the bytes it writes and the exit code it ends with.

[![Bounty](https://img.shields.io/badge/bounty-tiny--stack--vm--01-7c3aed)](https://make.fun/bounty/tiny-stack-vm-01-run-20261122)
[![Competition](https://img.shields.io/badge/competition-tiny--stack--vm--01-22c55e)](https://make.fun/competitions/tiny-stack-vm-01-run-20261122)
[![make.fun](https://img.shields.io/badge/make.fun-bounty-0ea5e9)](https://make.fun)

Bounty: https://make.fun/bounty/tiny-stack-vm-01-run-20261122

Run `node main.ts`: it reads `MAKEFUN_INPUT_DIR` (default `/input`) and
writes each instance's `stdout.bin` and `exit.txt` to `MAKEFUN_OUTPUT_DIR`
(default `/output`).
