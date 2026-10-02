import JSZip from "jszip";

export interface MetaDataTag {
    name: string;
    value?: string;
    resource?: string;
}

export async function extractMetadataFromAPK(file: File): Promise<MetaDataTag[]> {
    try {
        const zip = await JSZip.loadAsync(file);
        const manifest = zip.file("AndroidManifest.xml");
        if (!manifest) {
            throw new Error("AndroidManifest.xml not found in APK");
        }
        return parseManifest(await manifest.async("uint8array"));
    } catch (error) {
        throw new Error(
            `Failed to parse APK: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

function parseManifest(bytes: Uint8Array): MetaDataTag[] {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const xmlType = 0x0003;
    const stringPoolType = 0x0001;
    const startElementType = 0x0102;
    const endElementType = 0x0103;
    const noIndex = 0xffffffff;
    const rootSize = view.getUint32(4, true);
    if (view.getUint16(0, true) !== xmlType || rootSize > bytes.length) {
        throw new Error("AndroidManifest.xml is not valid Android binary XML");
    }

    let strings: string[] = [];
    const metadata: MetaDataTag[] = [];
    const elements: string[] = [];

    for (let offset = view.getUint16(2, true); offset + 8 <= rootSize;) {
        const type = view.getUint16(offset, true);
        const headerSize = view.getUint16(offset + 2, true);
        const chunkSize = view.getUint32(offset + 4, true);
        if (chunkSize < headerSize || offset + chunkSize > rootSize) {
            throw new Error("AndroidManifest.xml contains an invalid chunk");
        }

        if (type === stringPoolType) {
            strings = readStringPool(view, offset, headerSize);
        } else if (type === startElementType && strings.length > 0) {
            const extension = offset + 16;
            const elementName = strings[view.getUint32(extension + 4, true)];
            if (elementName === "meta-data" && elements.at(-1) === "application") {
                const attributeStart = view.getUint16(extension + 8, true);
                const attributeSize = view.getUint16(extension + 10, true);
                const attributeCount = view.getUint16(extension + 12, true);
                const attributesOffset = extension + attributeStart;
                const attributes: Record<string, string> = {};

                for (let index = 0; index < attributeCount; index++) {
                    const attributeOffset = attributesOffset + index * attributeSize;
                    if (attributeSize < 20 || attributeOffset + 20 > offset + chunkSize) {
                        throw new Error("AndroidManifest.xml contains an invalid attribute");
                    }
                    const name = strings[view.getUint32(attributeOffset + 4, true)];
                    const rawValue = view.getUint32(attributeOffset + 8, true);
                    const value = rawValue !== noIndex
                        ? strings[rawValue]
                        : readTypedValue(view, attributeOffset + 12, strings);
                    if (name && value !== undefined) attributes[name] = value;
                }

                if (attributes.name) {
                    metadata.push({
                        name: attributes.name,
                        ...(attributes.value !== undefined && { value: attributes.value }),
                        ...(attributes.resource !== undefined && { resource: attributes.resource }),
                    });
                }
            }
            if (elementName) elements.push(elementName);
        } else if (type === endElementType && strings.length > 0) {
            elements.pop();
        }

        offset += chunkSize;
    }

    return metadata;
}

function readStringPool(view: DataView, offset: number, headerSize: number): string[] {
    const stringCount = view.getUint32(offset + 8, true);
    const flags = view.getUint32(offset + 16, true);
    const stringsStart = view.getUint32(offset + 20, true);
    const isUtf8 = (flags & 0x100) !== 0;
    const decoder = new TextDecoder(isUtf8 ? "utf-8" : "utf-16le");
    const result: string[] = [];

    for (let index = 0; index < stringCount; index++) {
        let cursor = offset + headerSize + index * 4;
        const relativeOffset = view.getUint32(cursor, true);
        cursor = offset + stringsStart + relativeOffset;
        let byteLength: number;

        if (isUtf8) {
            [, cursor] = readLength8(view, cursor);
            [byteLength, cursor] = readLength8(view, cursor);
        } else {
            let length = view.getUint16(cursor, true);
            cursor += 2;
            if (length & 0x8000) {
                length = ((length & 0x7fff) << 16) | view.getUint16(cursor, true);
                cursor += 2;
            }
            byteLength = length * 2;
        }

        result.push(decoder.decode(new Uint8Array(view.buffer, view.byteOffset + cursor, byteLength)));
    }

    return result;
}

function readLength8(view: DataView, offset: number): [number, number] {
    const first = view.getUint8(offset++);
    if (first & 0x80) {
        return [((first & 0x7f) << 8) | view.getUint8(offset), offset + 1];
    }
    return [first, offset];
}

function readTypedValue(view: DataView, offset: number, strings: string[]): string | undefined {
    const type = view.getUint8(offset + 3);
    const value = view.getUint32(offset + 4, true);
    switch (type) {
        case 0x01:
            return `@0x${value.toString(16)}`;
        case 0x02:
            return `?0x${value.toString(16)}`;
        case 0x03:
            return strings[value];
        case 0x10:
            return String(value | 0);
        case 0x11:
            return `0x${value.toString(16)}`;
        case 0x12:
            return value === 0 ? "false" : "true";
        default:
            return undefined;
    }
}
