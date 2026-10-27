import base64, gzip, hashlib, json, os
from pathlib import Path, PurePosixPath
payload = base64.b64decode(Path(os.environ["RUNNER_TEMP"], "tea-overlay.b64").read_text())
assert hashlib.sha256(payload).hexdigest() == "337516f0e3879a0d9225b55505332662a8f52913cae8da505750c0fea8a9dec3", "Payload digest mismatch"
data = json.loads(gzip.decompress(payload))
assert data["source"] == "f89b03e738fe94f2bea6927c84e05871293707ea"
root = Path.cwd()
def target(name):
    parts = PurePosixPath(name).parts
    assert parts and ".." not in parts and ".git" not in parts and not name.startswith("/")
    return root.joinpath(*parts)
for name in data["delete"]:
    p = target(name)
    if p.exists():
        assert p.is_file()
        p.unlink()
for entry in data["files"]:
    p = target(entry["path"])
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(entry["text"], encoding="utf-8")
    p.chmod(entry["mode"])
print("Applied", len(data["files"]), "files and", len(data["delete"]), "deletions")
