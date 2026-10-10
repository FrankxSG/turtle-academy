"""Basic tracked-file guard; not a complete privacy or publication audit."""
import pathlib
import re
import subprocess
import sys

PROHIBITED_DIRS = {"worksheets", "student-records", "learner-records", "private-data", "production-data", "mistake-bank", "project_sources"}
RAW_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".heic", ".jpeg", ".jpg"}
PATTERNS = {
    "private key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "GitHub token": re.compile(rb"(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})"),
    "privileged key assignment": re.compile(rb"(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY)\s*[:=]\s*[\"']?[A-Za-z0-9_.-]{24,}"),
}


def inspect(path, data):
    p = pathlib.PurePosixPath(path)
    issues = []
    if set(part.lower() for part in p.parts) & PROHIBITED_DIRS:
        issues.append("prohibited private-data directory")
    if p.suffix.lower() in RAW_EXTENSIONS:
        issues.append("raw document/photo format requires separate private storage")
    if p.name == ".env" or (p.name.startswith(".env.") and p.name != ".env.example"):
        issues.append("environment credentials file")
    if p.suffix.lower() in {".dump", ".backup", ".sqlite", ".sqlite3"}:
        issues.append("database export")
    for name, pattern in PATTERNS.items():
        if pattern.search(data):
            issues.append(name)
    return issues


def main():
    root = pathlib.Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())
    paths = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).split(b"\0")
    failures = []
    for raw in paths:
        if not raw:
            continue
        path = raw.decode("utf-8", "surrogateescape")
        file = root / path
        if file.is_symlink():
            failures.append((path, "symlink requires manual review"))
            continue
        if not file.is_file():
            failures.append((path, "tracked file missing"))
            continue
        failures.extend((path, issue) for issue in inspect(path, file.read_bytes()))
    for path, issue in failures:
        print(f"BLOCKED: {path}: {issue}")
    if failures:
        return 1
    print("Basic tracked-file guard passed. Full privacy/history review still required.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
