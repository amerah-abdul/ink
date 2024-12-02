import { expect } from 'chai';
import Parser from '../src/StyleParser';
import type FileSystem from '@stackpress/types/dist/filesystem/FileSystem';
import type { ParserOptions } from '../src/types';
import FileLoader from '@stackpress/types/dist/filesystem/FileLoader';
import Exception from '../src/Exception';
import { Readable } from 'stream';

class MockFS implements FileSystem {
  private files: Map<string, string> = new Map();
  private stats: Map<string, { isDirectory: () => boolean; isFile: () => boolean }> = new Map();

  public writeFileSync(path: string, content: string): void {
    const normalizedPath = this.normalizePath(path);
    this.files.set(normalizedPath, content);
    this.stats.set(normalizedPath, { 
      isDirectory: () => false,
      isFile: () => true
    });
  }

  public readFileSync(path: string): string {
    const content = this.files.get(this.normalizePath(path));
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  }

  public existsSync(path: string): boolean {
    return this.files.has(this.normalizePath(path));
  }

  public realpathSync(path: string): string {
    return this.normalizePath(path);
  }

  public lstatSync(path: string): { isDirectory: () => boolean; isFile: () => boolean } {
    const stats = this.stats.get(this.normalizePath(path));
    if (!stats) {
      throw new Error(`ENOENT: no such file or directory, lstat '${path}'`);
    }
    return stats;
  }

  public mkdirSync(path: string): void {
    const normalizedPath = this.normalizePath(path);
    this.stats.set(normalizedPath, { 
      isDirectory: () => true,
      isFile: () => false
    });
  }

  public createReadStream(path: string): Readable {
    const content = this.readFileSync(path);
    return Readable.from(content);
  }

  public unlinkSync(path: string): void {
    const normalizedPath = this.normalizePath(path);
    this.files.delete(normalizedPath);
    this.stats.delete(normalizedPath);
  }

  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/');
  }
}

class MockLoader extends FileLoader {
  constructor(fs: FileSystem, cwd: string) {
    super(fs, cwd);
  }

  public absolute(path: string, pwd: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    return pwd.replace(/\/$/, '') + '/' + path;
  }
}

describe('StyleParser', () => {
  describe('match', () => {
    it('should extract unique classnames from content', () => {
      const content = 'class="button primary" class="button secondary"';
      const result = Parser.match(content);
      expect(result).to.deep.equal(['button', 'primary', 'secondary']);
    });

    it('should handle hyphenated classnames', () => {
      const content = 'class="btn-primary text-center"';
      const result = Parser.match(content);
      expect(result).to.deep.equal(['btn-primary', 'text-center']);
    });

    it('should return empty array for no matches', () => {
      const content = 'no classes here';
      const result = Parser.match(content);
      expect(result).to.deep.equal([]);
    });

    it('should handle multiple hyphens and numbers', () => {
      const content = 'class="col-md-6 grid-2"';
      const result = Parser.match(content);
      expect(result).to.deep.equal(['col-md-6', 'grid-2']);
    });
  });

  describe('Parser instance', () => {
    let parser: Parser;
    let mockFS: MockFS;

    beforeEach(() => {
      mockFS = new MockFS();
      const options: ParserOptions = {
        cwd: '/',
        fs: mockFS
      };
      parser = new Parser(options);
      // Replace the loader with our mock loader
      (parser as any)._loader = new MockLoader(mockFS, '/');
    });

    it('should initialize with correct cwd', () => {
      expect(parser.cwd).to.equal('/');
    });

    it('should have filesystem initialized', () => {
      expect(parser.fs).to.exist;
    });

    it('should have loader initialized', () => {
      expect(parser.loader).to.exist;
    });

    it('should initialize with default options', () => {
      const defaultParser = new Parser();
      expect(defaultParser.cwd).to.equal(process.cwd());
      expect(defaultParser.fs).to.exist;
      expect(defaultParser.loader).to.exist;
    });

    describe('vfs operations', () => {
      it('should set and retrieve content from vfs', () => {
        const content = 'class="test-class"';
        parser.set('/test.html', content);
        expect(parser.vfs.get('/test.html')).to.equal(content);
      });

      it('should parse content from multiple files', () => {
        parser.set('/test1.html', 'class="test-1"');
        parser.set('/test2.html', 'class="test-2"');
        const result = parser.parse();
        expect(result).to.deep.equal(['test-1', 'test-2']);
      });

      it('should walk through all classes in vfs', () => {
        parser.set('/test1.html', 'class="walk-1 walk-2"');
        parser.set('/test2.html', 'class="walk-3"');
        const classes = Array.from(parser.walk());
        expect(classes).to.deep.equal(['walk-1', 'walk-2', 'walk-3']);
      });
    });

    describe('file operations', () => {
      it('should throw exception when file not found', () => {
        expect(() => parser.add('/nonexistent.html')).to.throw('File not found');
      });

      it('should add file content to vfs', () => {
        const content = 'class="file-test"';
        mockFS.writeFileSync('/test.html', content);
        expect(parser.vfs.has('/test.html')).to.be.false;
        parser.add('/test.html');
        expect(parser.vfs.get('/test.html')).to.equal(content);
      });

      it('should handle relative paths', () => {
        const content = 'class="relative-test"';
        mockFS.writeFileSync('/path/test.html', content);
        parser.add('test.html', '/path');
        expect(parser.vfs.get('/path/test.html')).to.equal(content);
        const result = parser.parse();
        expect(result).to.deep.equal(['relative-test']);
      });

      it('should skip if file already in vfs', () => {
        const content = 'class="cached"';
        parser.set('/cached.html', content);
        mockFS.writeFileSync('/cached.html', 'different content');
        parser.add('/cached.html');
        expect(parser.vfs.get('/cached.html')).to.equal(content);
      });
    });
  });
});
