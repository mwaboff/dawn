import { FormatTextPipe } from './format-text.pipe';

describe('FormatTextPipe', () => {
  let pipe: FormatTextPipe;

  beforeEach(() => {
    pipe = new FormatTextPipe();
  });

  it('should return plain text unchanged', () => {
    expect(pipe.transform('hello world')).toBe('hello world');
  });

  it('should convert newlines to <br> tags', () => {
    expect(pipe.transform('line one\nline two')).toBe('line one<br>line two');
  });

  it('should handle multiple consecutive newlines', () => {
    expect(pipe.transform('a\n\nb')).toBe('a<br><br>b');
  });

  it('should escape HTML special characters', () => {
    expect(pipe.transform('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('should escape ampersands', () => {
    expect(pipe.transform('rock & roll')).toBe('rock &amp; roll');
  });

  it('should handle combined escaping and newlines', () => {
    expect(pipe.transform('a < b\nc > d')).toBe('a &lt; b<br>c &gt; d');
  });

  it('should return empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for empty string', () => {
    expect(pipe.transform('')).toBe('');
  });
});
