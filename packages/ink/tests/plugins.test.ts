import { esAliasPlugin, esComponentPlugin, esDocumentPlugin } from '../src/plugins';
import FileSystem from '@stackpress/types/dist/filesystem/NodeFS';
import path from 'path';
import { expect } from 'chai';

describe('esAliasPlugin', () => {
  let mockFs: FileSystem;
  const cwd = process.cwd();

  beforeEach(() => {
    mockFs = new FileSystem();
    (mockFs as any).existsSync = () => true;
    (mockFs as any).lstatSync = () => ({
      isFile: () => true
    });
  });

  it('should resolve @/ alias to absolute path', () => {
    const plugin = esAliasPlugin({ fs: mockFs, cwd });
    let resolveCallCount = 0;
    let resolveResult: any;
    
    const build = {
      onResolve: (options: any, callback: any) => {
        resolveCallCount++;
        resolveResult = callback({ path: '@/test.ts' });
      }
    };

    plugin.setup(build as any);
    expect(resolveCallCount).to.equal(1);
    expect(resolveResult.path).to.equal(path.resolve(cwd, 'test.ts'));
    expect(resolveResult.loader).to.equal('ts');
  });

  it('should handle .ink files correctly', () => {
    const plugin = esAliasPlugin({ fs: mockFs, cwd });
    let resolveCallCount = 0;
    let resolveResult: any;
    
    const build = {
      onResolve: (options: any, callback: any) => {
        resolveCallCount++;
        resolveResult = callback({ path: '@/test.ink' });
      }
    };

    plugin.setup(build as any);
    expect(resolveCallCount).to.equal(1);
    expect(resolveResult.path).to.equal(path.resolve(cwd, 'test.ink'));
    expect(resolveResult.namespace).to.equal('ink-component-plugin');
  });

  it('should try different extensions when resolving path', () => {
    const plugin = esAliasPlugin({ fs: mockFs, cwd });
    let fileChecks = 0;
    (mockFs as any).existsSync = (path: string) => {
      fileChecks++;
      return path.endsWith('test.ts');
    };
    
    const build = {
      onResolve: (options: any, callback: any) => {
        callback({ path: '@/test' });
      }
    };

    plugin.setup(build as any);
    expect(fileChecks).to.be.greaterThan(1);
  });
});

describe('esComponentPlugin', () => {
  let mockFs: FileSystem;
  const cwd = process.cwd();

  beforeEach(() => {
    mockFs = new FileSystem();
    (mockFs as any).existsSync = () => true;
    (mockFs as any).lstatSync = () => ({
      isFile: () => true
    });
  });

  it('should set up component plugin with default options', () => {
    const plugin = esComponentPlugin({ fs: mockFs, cwd });
    expect(plugin.name).to.equal('ink-component-plugin');
  });

  it('should resolve .ink files', () => {
    const plugin = esComponentPlugin({ fs: mockFs, cwd });
    let resolveCallCount = 0;
    let resolveResult: any;
    
    const build = {
      onResolve: (options: any, callback: any) => {
        resolveCallCount++;
        resolveResult = callback({ 
          path: './Component.ink',
          importer: path.join(cwd, 'src/index.ts')
        });
      },
      onLoad: () => {}
    };

    plugin.setup(build as any);
    expect(resolveCallCount).to.equal(1);
    expect(resolveResult.namespace).to.equal('ink-component-plugin');
  });

  it('should load and transpile component files', () => {
    const plugin = esComponentPlugin({ fs: mockFs, cwd });
    let loadCallCount = 0;
    let loadResult: any;
    
    // Mock readFileSync to return a simple component content
    (mockFs as any).readFileSync = () => 'export default component {}';
    
    const build = {
      onResolve: () => {},
      onLoad: (options: any, callback: any) => {
        loadCallCount++;
        loadResult = callback({ 
          path: path.join(cwd, 'src/Component.ink')
        });
      }
    };

    plugin.setup(build as any);
    expect(loadCallCount).to.equal(1);
    expect(loadResult.loader).to.equal('ts');
    expect(loadResult.resolveDir).to.equal(path.join(cwd, 'src'));
  });
});

describe('esDocumentPlugin', () => {
  let mockFs: FileSystem;
  const cwd = process.cwd();

  beforeEach(() => {
    mockFs = new FileSystem();
    (mockFs as any).existsSync = () => true;
    (mockFs as any).lstatSync = () => ({
      isFile: () => true
    });
  });

  it('should set up document plugin with default options', () => {
    const plugin = esDocumentPlugin({ fs: mockFs, cwd });
    expect(plugin.server.name).to.equal('ink-document-server-plugin');
    expect(plugin.client.name).to.equal('ink-document-client-plugin');
  });

  it('should handle document files with custom extension', () => {
    const plugin = esDocumentPlugin({ 
      fs: mockFs, 
      cwd,
      extname: '.doc'
    });
    let serverResolveCount = 0;
    let clientResolveCount = 0;
    
    const serverBuild = {
      onResolve: (options: any, callback: any) => {
        serverResolveCount++;
        const result = callback({ 
          path: './document.doc',
          importer: path.join(cwd, 'src/index.ts')
        });
        expect(result.namespace).to.equal('ink-document-server-plugin');
      },
      onLoad: () => {}
    };

    const clientBuild = {
      onResolve: (options: any, callback: any) => {
        clientResolveCount++;
        const result = callback({ 
          path: './document.doc',
          importer: path.join(cwd, 'src/index.ts')
        });
        expect(result.namespace).to.equal('ink-document-client-plugin');
      },
      onLoad: () => {}
    };

    plugin.server.setup(serverBuild as any);
    plugin.client.setup(clientBuild as any);
    expect(serverResolveCount).to.equal(1);
    expect(clientResolveCount).to.equal(1);
  });
});
