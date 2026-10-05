async function printSecretMsg(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to fetch doc');
    }
    const html = await res.text();

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const points = [];
    let maxX = 0;
    let maxY = 0;

    let rowMatch;
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const rowContent = rowMatch[1];
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells = [];
      let cellMatch;

      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
        cells.push(text);
      }

      if (cells.length >= 3) {
        const x = parseInt(cells[0], 10);
        const char = cells[1];
        const y = parseInt(cells[2], 10);

        if (!isNaN(x) && !isNaN(y) && char.length > 0) {
          points.push({ x, y, char });
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    const grid = Array.from({ length: maxY + 1 }, () => Array(maxX + 1).fill(' '));
    for (const { x, y, char } of points) {
      grid[y][x] = char;
    }

    for (let y = maxY; y >= 0; y--) {
      console.log(grid[y].join(''));
    }
  } catch (e) {
    console.error('Error processing document:', e);
  }
}

printSecretMsg('https://docs.google.com/document/d/e/2PACX-1vSvM5gDlNvt7npYHhp_XfsJvuntUhq184By5xO_pA4b_gCWeXb6dM6ZxwN8rE6S4ghUsCj2VKR21oEP/pub');