import { spawn } from 'child_process';

const args = process.argv.slice(2);
const filteredArgs = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--host') {
    if (args[i + 1] && !args[i + 1].startsWith('-')) {
      i++; // skip the host value
    }
  } else {
    filteredArgs.push(args[i]);
  }
}

// Always ensure Next.js dev server runs on port 3000 and listens on 0.0.0.0
if (!filteredArgs.includes('-p') && !filteredArgs.includes('--port')) {
  filteredArgs.push('-p', '3000');
}
if (!filteredArgs.includes('-H') && !filteredArgs.includes('--hostname')) {
  filteredArgs.push('-H', '0.0.0.0');
}

const child = spawn('npx', ['next', 'dev', ...filteredArgs], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  process.exit(code || 0);
});
