# Utility Commands for MCPHub Development

## System Commands (Linux)
- `ls -la` - List files with details
- `cd <directory>` - Change directory
- `pwd` - Print working directory
- `mkdir <name>` - Create directory
- `rm -rf <path>` - Remove files/directories
- `cp -r <source> <dest>` - Copy files/directories
- `mv <source> <dest>` - Move/rename files
- `find . -name "*.ts"` - Find TypeScript files
- `grep -r "pattern" .` - Search for pattern in files
- `cat <file>` - Display file contents
- `head -n 20 <file>` - Show first 20 lines
- `tail -n 20 <file>` - Show last 20 lines
- `ps aux | grep node` - Check running Node processes
- `kill <pid>` - Kill process by ID
- `df -h` - Check disk space
- `du -sh <directory>` - Check directory size

## Git Commands
- `git status` - Check repository status
- `git log --oneline -10` - Show recent commits
- `git diff` - Show unstaged changes
- `git diff --staged` - Show staged changes
- `git add <file>` - Stage file for commit
- `git commit -m "message"` - Commit staged changes
- `git push origin <branch>` - Push to remote branch
- `git pull origin <branch>` - Pull from remote branch
- `git checkout <branch>` - Switch branches
- `git branch -a` - List all branches
- `git stash` - Stash uncommitted changes
- `git stash pop` - Apply stashed changes

## Docker Commands
- `docker ps` - List running containers
- `docker ps -a` - List all containers
- `docker images` - List Docker images
- `docker logs <container>` - Show container logs
- `docker exec -it <container> bash` - Enter container shell
- `docker build -t <name> .` - Build Docker image
- `docker run <image>` - Run Docker container
- `docker stop <container>` - Stop container
- `docker rm <container>` - Remove container
- `docker system prune` - Clean up unused resources

## Node.js/npm/pnpm Commands
- `node --version` - Check Node version
- `npm --version` - Check npm version
- `pnpm --version` - Check pnpm version
- `pnpm install` - Install dependencies
- `pnpm update` - Update dependencies
- `pnpm add <package>` - Add dependency
- `pnpm remove <package>` - Remove dependency
- `pnpm list` - List installed packages
- `pnpm run <script>` - Run package script

## Database Commands (PostgreSQL)
- `psql -U <user> -d <database>` - Connect to PostgreSQL
- `\dt` - List tables
- `\d <table>` - Describe table
- `SELECT * FROM <table> LIMIT 10;` - Query table
- `\q` - Quit psql

## Network Commands
- `curl http://localhost:3000` - Test HTTP endpoint
- `netstat -tlnp | grep 3000` - Check if port is listening
- `lsof -i :3000` - Check what's using port 3000
- `ping <host>` - Test network connectivity

## Text Processing
- `wc -l <file>` - Count lines in file
- `sort <file>` - Sort file contents
- `uniq <file>` - Remove duplicate lines
- `sed 's/old/new/g' <file>` - Replace text in file
- `awk '{print $1}' <file>` - Extract first column

## Compression/Archiving
- `tar -czf archive.tar.gz <directory>` - Create gzip archive
- `tar -xzf archive.tar.gz` - Extract gzip archive
- `zip -r archive.zip <directory>` - Create zip archive
- `unzip archive.zip` - Extract zip archive

## Permissions
- `chmod +x <file>` - Make file executable
- `chown <user>:<group> <file>` - Change file ownership
- `ls -l <file>` - Check file permissions