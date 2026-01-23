/**
 * Email Parser Utility
 * Parst .eml bestanden en extraheert relevante velden voor intake
 */

/**
 * Parse een .eml bestand
 * @param {string} emlContent - Inhoud van het .eml bestand
 * @returns {Object} Geparseerde email data
 */
export function parseEml(emlContent) {
    const result = {
        subject: '',
        from: '',
        fromName: '',
        fromEmail: '',
        to: '',
        date: null,
        body: '',
        bodyHtml: '',
        attachments: []
    };

    // Split headers en body
    const headerBodySplit = emlContent.indexOf('\r\n\r\n') !== -1
        ? emlContent.indexOf('\r\n\r\n')
        : emlContent.indexOf('\n\n');

    const headerSection = emlContent.substring(0, headerBodySplit);
    const bodySection = emlContent.substring(headerBodySplit + (emlContent.indexOf('\r\n\r\n') !== -1 ? 4 : 2));

    // Parse headers
    const headers = parseHeaders(headerSection);

    result.subject = decodeHeader(headers['subject'] || '');
    result.from = headers['from'] || '';
    result.to = headers['to'] || '';
    result.date = headers['date'] ? new Date(headers['date']) : null;

    // Parse from field voor naam en email
    const fromMatch = result.from.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+@[^>]+)>?$/);
    if (fromMatch) {
        result.fromName = decodeHeader(fromMatch[1]?.trim() || '');
        result.fromEmail = fromMatch[2]?.trim() || '';
    } else {
        result.fromEmail = result.from;
    }

    // Parse body
    const contentType = headers['content-type'] || 'text/plain';
    const boundary = extractBoundary(contentType);

    if (boundary) {
        // Multipart message
        const parts = parseMultipart(bodySection, boundary);
        for (const part of parts) {
            if (part.contentType?.includes('text/plain') && !result.body) {
                result.body = decodeBody(part.body, part.encoding);
            } else if (part.contentType?.includes('text/html') && !result.bodyHtml) {
                result.bodyHtml = decodeBody(part.body, part.encoding);
            } else if (part.filename) {
                result.attachments.push({
                    filename: part.filename,
                    contentType: part.contentType,
                    size: part.body?.length || 0
                });
            }
        }
    } else {
        // Simple message
        const encoding = headers['content-transfer-encoding'] || '7bit';
        result.body = decodeBody(bodySection, encoding);
    }

    // Clean up body
    result.body = cleanBody(result.body);

    return result;
}

/**
 * Parse email headers
 */
function parseHeaders(headerSection) {
    const headers = {};
    const lines = headerSection.split(/\r?\n/);
    let currentHeader = '';
    let currentValue = '';

    for (const line of lines) {
        if (line.match(/^\s+/) && currentHeader) {
            // Continuation of previous header
            currentValue += ' ' + line.trim();
        } else {
            // Save previous header
            if (currentHeader) {
                headers[currentHeader.toLowerCase()] = currentValue;
            }
            // Start new header
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                currentHeader = line.substring(0, colonIndex).trim();
                currentValue = line.substring(colonIndex + 1).trim();
            }
        }
    }
    // Save last header
    if (currentHeader) {
        headers[currentHeader.toLowerCase()] = currentValue;
    }

    return headers;
}

/**
 * Decode encoded header (=?UTF-8?Q?...?= of =?UTF-8?B?...?=)
 */
function decodeHeader(value) {
    if (!value) return '';

    return value.replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (match, charset, encoding, text) => {
        try {
            if (encoding.toUpperCase() === 'B') {
                // Base64
                return atob(text);
            } else if (encoding.toUpperCase() === 'Q') {
                // Quoted-printable
                return text.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (m, hex) =>
                    String.fromCharCode(parseInt(hex, 16))
                );
            }
        } catch (e) {
            return text;
        }
        return text;
    });
}

/**
 * Extract boundary from content-type header
 */
function extractBoundary(contentType) {
    const match = contentType.match(/boundary="?([^";\s]+)"?/i);
    return match ? match[1] : null;
}

/**
 * Parse multipart message
 */
function parseMultipart(body, boundary) {
    const parts = [];
    const delimiter = '--' + boundary;
    const sections = body.split(delimiter);

    for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        if (section.startsWith('--')) continue; // End boundary

        const partHeaderEnd = section.indexOf('\r\n\r\n') !== -1
            ? section.indexOf('\r\n\r\n')
            : section.indexOf('\n\n');

        if (partHeaderEnd === -1) continue;

        const partHeaders = parseHeaders(section.substring(0, partHeaderEnd));
        const partBody = section.substring(partHeaderEnd + (section.indexOf('\r\n\r\n') !== -1 ? 4 : 2)).trim();

        const contentType = partHeaders['content-type'] || 'text/plain';
        const contentDisposition = partHeaders['content-disposition'] || '';
        const encoding = partHeaders['content-transfer-encoding'] || '7bit';

        // Check for filename
        let filename = null;
        const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i) ||
                             contentType.match(/name="?([^";\n]+)"?/i);
        if (filenameMatch) {
            filename = decodeHeader(filenameMatch[1]);
        }

        // Check for nested multipart
        const nestedBoundary = extractBoundary(contentType);
        if (nestedBoundary) {
            const nestedParts = parseMultipart(partBody, nestedBoundary);
            parts.push(...nestedParts);
        } else {
            parts.push({
                contentType,
                encoding,
                filename,
                body: partBody
            });
        }
    }

    return parts;
}

/**
 * Decode body based on transfer encoding
 */
function decodeBody(body, encoding) {
    if (!body) return '';

    encoding = (encoding || '7bit').toLowerCase();

    if (encoding === 'base64') {
        try {
            return atob(body.replace(/\s/g, ''));
        } catch (e) {
            return body;
        }
    } else if (encoding === 'quoted-printable') {
        return body
            .replace(/=\r?\n/g, '') // Soft line breaks
            .replace(/=([0-9A-F]{2})/gi, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
    }

    return body;
}

/**
 * Clean up body text
 */
function cleanBody(body) {
    if (!body) return '';

    return body
        // Remove excessive whitespace
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        // Remove common email signatures/footers
        .replace(/^[-_]{2,}\s*$/gm, '')
        // Trim
        .trim();
}

/**
 * Extract summary from email body (eerste 500 karakters)
 */
export function extractSummary(body, maxLength = 500) {
    if (!body) return '';

    // Remove quoted replies (lines starting with >)
    const withoutQuotes = body.split('\n')
        .filter(line => !line.trim().startsWith('>'))
        .join('\n');

    // Get first paragraph or maxLength characters
    const firstPara = withoutQuotes.split('\n\n')[0] || withoutQuotes;

    if (firstPara.length <= maxLength) {
        return firstPara.trim();
    }

    return firstPara.substring(0, maxLength).trim() + '...';
}

/**
 * Convert parsed email to intake data
 */
export function emailToIntakeData(parsedEmail) {
    return {
        onderwerp: parsedEmail.subject || 'Intake vanuit email',
        aanvrager: parsedEmail.fromName || parsedEmail.fromEmail || '',
        aanvragerEmail: parsedEmail.fromEmail || '',
        korteOmschrijving: extractSummary(parsedEmail.body, 500),
        volledigeEmail: parsedEmail.body,
        emailDatum: parsedEmail.date ? parsedEmail.date.toISOString() : new Date().toISOString(),
        emailBijlagen: parsedEmail.attachments.map(a => a.filename)
    };
}

export default { parseEml, extractSummary, emailToIntakeData };
