import { escapeAndFormatHtml } from './text.utils';

describe('escapeAndFormatHtml', () => {
  it('should return empty string for empty input', () => {
    expect(escapeAndFormatHtml('')).toBe('');
  });

  it('should convert newlines to <br> tags', () => {
    expect(escapeAndFormatHtml('line one\nline two')).toBe('line one<br>line two');
  });

  it('should handle multiple consecutive newlines', () => {
    expect(escapeAndFormatHtml('a\n\nb')).toBe('a<br><br>b');
  });

  it('should escape HTML special characters', () => {
    expect(escapeAndFormatHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape ampersands', () => {
    expect(escapeAndFormatHtml('A & B')).toBe('A &amp; B');
  });

  it('should return normal text unchanged', () => {
    expect(escapeAndFormatHtml('Hello world')).toBe('Hello world');
  });

  it('should handle text with both special chars and newlines', () => {
    expect(escapeAndFormatHtml('a < b\nc > d')).toBe('a &lt; b<br>c &gt; d');
  });
});
