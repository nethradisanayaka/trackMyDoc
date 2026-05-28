/* ==========================================================================
   DYNAMIC BARCODE / QR CODE VECTOR GENERATOR (js/utils/qr-generator.js)
   ========================================================================== */

/**
 * Programmatically generates a highly authentic vector SVG QR Code
 * complete with corner anchor targets and randomized data patterns.
 * @param {string} text - Content identifier to embed
 * @returns {string} SVG String representing the QR code
 */
function generateQR(text = 'DOC-ID') {
    // Basic hash function to generate deterministic patterns per text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    const gridSize = 25; // 25x25 QR matrix
    const padding = 2;
    const size = 150;
    const cellSize = size / (gridSize + padding * 2);
    
    let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    // Background card (soft premium grid background feel)
    svgContent += `<rect width="${size}" height="${size}" rx="12" fill="#0f172a" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>`;
    
    // Function to draw QR anchor patterns
    const drawAnchor = (cx, cy) => {
        // Outer square
        svgContent += `<rect x="${cx}" y="${cy}" width="${cellSize * 7}" height="${cellSize * 7}" fill="#ffffff" rx="1.5"/>`;
        // Inner negative spacer
        svgContent += `<rect x="${cx + cellSize}" y="${cy + cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="#0f172a" rx="1"/>`;
        // Solid center core
        svgContent += `<rect x="${cx + cellSize * 2}" y="${cy + cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="#6366f1" rx="0.5"/>`;
    };
    
    // Draw 3 primary corner anchors
    const padCell = padding * cellSize;
    drawAnchor(padCell, padCell); // Top-Left
    drawAnchor(padCell + cellSize * (gridSize - 7), padCell); // Top-Right
    drawAnchor(padCell, padCell + cellSize * (gridSize - 7)); // Bottom-Left
    
    // Alignment pattern near bottom-right
    const alignX = padCell + cellSize * (gridSize - 9);
    const alignY = padCell + cellSize * (gridSize - 9);
    svgContent += `<rect x="${alignX}" y="${alignY}" width="${cellSize * 5}" height="${cellSize * 5}" fill="#ffffff" rx="1"/>`;
    svgContent += `<rect x="${alignX + cellSize}" y="${alignY + cellSize}" width="${cellSize * 3}" height="${cellSize * 3}" fill="#0f172a" rx="0.5"/>`;
    svgContent += `<rect x="${alignX + cellSize * 2}" y="${alignY + cellSize * 2}" width="${cellSize}" height="${cellSize}" fill="#10b981"/>`;

    // Fill randomized but deterministic data blocks
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            // Skip anchor regions to avoid overlapping tracking patterns
            const isTopLeft = r < 8 && c < 8;
            const isTopRight = r < 8 && c >= gridSize - 8;
            const isBottomLeft = r >= gridSize - 8 && c < 8;
            const isAlignment = r >= gridSize - 9 && r < gridSize - 4 && c >= gridSize - 9 && c < gridSize - 4;
            
            if (isTopLeft || isTopRight || isBottomLeft || isAlignment) continue;
            
            // Deterministic noise generator based on coordinate and text hash
            const pseudoRandom = Math.abs(Math.sin((r * 12.9898 + c * 78.233 + hash) * 43758.5453));
            if (pseudoRandom > 0.48) {
                const rx = padCell + c * cellSize;
                const ry = padCell + r * cellSize;
                const color = pseudoRandom > 0.92 ? '#10b981' : (pseudoRandom > 0.82 ? '#6366f1' : '#ffffff');
                svgContent += `<rect x="${rx}" y="${ry}" width="${cellSize}" height="${cellSize}" fill="${color}" rx="0.2"/>`;
            }
        }
    }
    
    svgContent += `</svg>`;
    return svgContent;
}

/**
 * Programmatically generates a vector SVG 1D Barcode with code readout text.
 * @param {string} code - Identifier code
 * @returns {string} SVG String representing the barcode
 */
function generateBarcode(code = 'DOC-ID') {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const width = 280;
    const height = 90;
    let svgContent = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">`;
    // Background board
    svgContent += `<rect width="${width}" height="${height}" rx="10" fill="#0f172a" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>`;
    
    // Barcode lines start and end
    const startX = 24;
    const availableWidth = width - startX * 2;
    const numBars = 45;
    const barSpacing = availableWidth / numBars;
    
    svgContent += `<g>`;
    for (let i = 0; i < numBars; i++) {
        // Deterministic widths based on index and code hash
        const val = Math.abs(Math.sin(i * 99 + hash * 12));
        const barWidth = val > 0.75 ? 4 : (val > 0.4 ? 2 : 1);
        const drawX = startX + i * barSpacing;
        
        // Quiet zone buffers at both boundaries
        if (i < 2 || i > numBars - 3) {
            // Guard bars (longer and solid thin lines)
            svgContent += `<rect x="${drawX}" y="14" width="1.5" height="50" fill="#6366f1"/>`;
        } else {
            if (val > 0.25) {
                svgContent += `<rect x="${drawX}" y="14" width="${barWidth}" height="42" fill="#ffffff"/>`;
            }
        }
    }
    svgContent += `</g>`;
    
    // Text readout at the bottom center
    svgContent += `<text x="50%" y="78" fill="#94a3b8" font-size="11" font-weight="700" letter-spacing="3" text-anchor="middle" font-family="monospace">${code}</text>`;
    svgContent += `</svg>`;
    return svgContent;
}

window.DocTrackQR = {
    generateQR: generateQR,
    generateBarcode: generateBarcode
};
