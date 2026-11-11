const files = [
  "app.py",
  "requirements.txt",
  "setup_windows.bat",
  "run_windows.bat",
  "README_LOCAL.md"
];

const button = document.querySelector("#download-button");
const status = document.querySelector("#download-status");

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function u32(value) {
  return [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  ];
}

function dosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  const day =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  return { time, day };
}

function buildZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const stamp = dosDateTime();

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = entry.data;
    const crc = crc32(data);

    const localHeader = new Uint8Array([
      ...u32(0x04034b50),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(stamp.time),
      ...u16(stamp.day),
      ...u32(crc),
      ...u32(data.length),
      ...u32(data.length),
      ...u16(name.length),
      ...u16(0)
    ]);

    localParts.push(localHeader, name, data);

    const centralHeader = new Uint8Array([
      ...u32(0x02014b50),
      ...u16(20),
      ...u16(20),
      ...u16(0),
      ...u16(0),
      ...u16(stamp.time),
      ...u16(stamp.day),
      ...u32(crc),
      ...u32(data.length),
      ...u32(data.length),
      ...u16(name.length),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u16(0),
      ...u32(0),
      ...u32(offset)
    ]);

    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  }

  const localSize = localParts.reduce((sum, part) => sum + part.length, 0);
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);

  const end = new Uint8Array([
    ...u32(0x06054b50),
    ...u16(0),
    ...u16(0),
    ...u16(entries.length),
    ...u16(entries.length),
    ...u32(centralSize),
    ...u32(localSize),
    ...u16(0)
  ]);

  return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
}

button.addEventListener("click", async () => {
  button.disabled = true;
  status.textContent = "Preparing download...";

  try {
    const encoder = new TextEncoder();

    const entries = await Promise.all(
      files.map(async name => {
        const response = await fetch(name, { cache: "no-store" });
        if (!response.ok) throw new Error(`Could not load ${name}.`);
        const text = await response.text();
        return { name, data: encoder.encode(text) };
      })
    );

    const blob = buildZip(entries);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "WrittenByD-Audio-Stem-Tool.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    status.textContent = "Download ready. Extract the ZIP, then run setup_windows.bat.";
  } catch (error) {
    status.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});
