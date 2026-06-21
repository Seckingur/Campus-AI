import fs from 'fs';
const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuMTnU1rJPAAAADUlEQVQYV2P4//8/AwAI/AL+Xvn1MgAAAABJRU5ErkJggg==', 'base64');
fs.writeFileSync('public/icon-512.png', png1x1);
fs.writeFileSync('public/icon-192.png', png1x1);
fs.writeFileSync('public/screenshot-portrait.png', png1x1);
fs.writeFileSync('public/screenshot-landscape.png', png1x1);
