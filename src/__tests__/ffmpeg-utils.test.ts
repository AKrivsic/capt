/**
 * Unit tests for FFmpeg utilities
 */

import { escapeDrawtextText, ensureTmp } from '@/subtitles/ffmpeg-utils';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('FFmpeg Utils', () => {
  describe('escapeDrawtextText', () => {
    it('should escape colons and single quotes', () => {
      const input = "Hello: world's test";
      const expected = "Hello\\: world\\'s test";
      expect(escapeDrawtextText(input)).toBe(expected);
    });

    it('should handle empty string', () => {
      expect(escapeDrawtextText('')).toBe('');
    });

    it('should handle unicode characters', () => {
      const input = "Hello: 世界's test";
      const expected = "Hello\\: 世界\\'s test";
      expect(escapeDrawtextText(input)).toBe(expected);
    });

    it('should handle multiple colons and quotes', () => {
      const input = "Test: 'quoted' : text";
      const expected = "Test\\: \\'quoted\\' \\: text";
      expect(escapeDrawtextText(input)).toBe(expected);
    });

    it('should escape backslashes', () => {
      const input = "Path: C:\\Users\\test";
      const expected = "Path\\: C\\\\Users\\\\test";
      expect(escapeDrawtextText(input)).toBe(expected);
    });

    it('should escape square brackets', () => {
      const input = "Text [with] brackets";
      const expected = "Text \\[with\\] brackets";
      expect(escapeDrawtextText(input)).toBe(expected);
    });

    it('should handle complex escaping', () => {
      const input = "Complex: 'text' with \\backslashes\\ and [brackets]";
      const expected = "Complex\\: \\'text\\' with \\\\backslashes\\\\ and \\[brackets\\]";
      expect(escapeDrawtextText(input)).toBe(expected);
    });
  });

  describe('ensureTmp', () => {
    it('should create directory if it does not exist', () => {
      const testDir = path.join(tmpdir(), 'test-ensure-tmp');
      const testFile = path.join(testDir, 'test.txt');
      
      // Clean up first
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
      
      ensureTmp(testFile);
      
      expect(fs.existsSync(testDir)).toBe(true);
      
      // Clean up
      fs.rmSync(testDir, { recursive: true });
    });

    it('should not fail if directory already exists', () => {
      const testDir = path.join(tmpdir(), 'test-ensure-tmp-existing');
      const testFile = path.join(testDir, 'test.txt');
      
      // Create directory first
      fs.mkdirSync(testDir, { recursive: true });
      
      expect(() => ensureTmp(testFile)).not.toThrow();
      expect(fs.existsSync(testDir)).toBe(true);
      
      // Clean up
      fs.rmSync(testDir, { recursive: true });
    });
  });
});
