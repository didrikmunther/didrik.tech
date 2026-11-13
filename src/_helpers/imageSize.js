const fs = require('fs');

// Reads intrinsic dimensions out of an image header, so pages can declare
// width and height without pulling in a dependency. Supports the formats the
// site ships: WebP (lossy, lossless and extended), JPEG and PNG.

const png = buffer => ({
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
});

const jpeg = buffer => {
    let offset = 2;
    while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) throw new Error('Not a JPEG segment');
        const marker = buffer[offset + 1];
        const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf
            && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isStartOfFrame) {
            return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        offset += 2 + buffer.readUInt16BE(offset + 2);
    }
    throw new Error('No JPEG frame header');
};

const webp = buffer => {
    const format = buffer.toString('ascii', 12, 16);
    if (format === 'VP8 ') {
        return {
            width: buffer.readUInt16LE(26) & 0x3fff,
            height: buffer.readUInt16LE(28) & 0x3fff
        };
    }
    if (format === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return {
            width: (bits & 0x3fff) + 1,
            height: ((bits >> 14) & 0x3fff) + 1
        };
    }
    if (format === 'VP8X') {
        return {
            width: buffer.readUIntLE(24, 3) + 1,
            height: buffer.readUIntLE(27, 3) + 1
        };
    }
    throw new Error(`Unsupported WebP chunk ${format}`);
};

module.exports = file => {
    const buffer = fs.readFileSync(file);
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return webp(buffer);
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return jpeg(buffer);
    if (buffer.toString('ascii', 1, 4) === 'PNG') return png(buffer);
    throw new Error(`Unrecognised image format: ${file}`);
};
