//modules
import path from 'node:path';
import { VariableDeclarationKind } from 'ts-morph';
//compiler
import type Component from '../compiler/Component';
import ComponentTranspiler from '../compiler/Transpiler';
//common
import type { MarkupToken } from '../types';

export default class Transpiler extends ComponentTranspiler {
  /**
   * Generates document code to be used on the server
   */
  public transpile() {
    const { 
      absolute, 
      classname, 
      imports,
      scripts, 
      styles 
    } = this._component;
    //get path without extension
    //ex. /path/to/Counter.ink -> /path/to/Counter
    const extname = path.extname(absolute);
    const filePath = absolute.slice(0, -extname.length);
    //create a new source file
    const { source } = this._createSourceFile(`${filePath}.ts`);
    //import { 
    //  InkDocument,
    //  InkElement,  
    //  InkRegistry
    //} from '@stackpress/ink/server';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ink/server',
      namedImports: [
        'InkDocument',
        'InkElement',  
        'InkRegistry'
      ]
    });
    //import others from <script>
    imports.forEach(imported => {
      const specifier = imported.source
        //replace client with server
        .replaceAll('@stackpress/ink/client', '@stackpress/ink/server')
        .replaceAll('@stackpress/ink/dist/client', '@stackpress/ink/dist/server')
        .replace(/^@stackpress\/ink$/, '@stackpress/ink/server');
      if (imported.default && imported.names) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: specifier,
          defaultImport: imported.default,
          namedImports: imported.names
        });
      } else if (imported.default) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: specifier,
          defaultImport: imported.default
        });
      } else if (imported.names) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: specifier,
          namedImports: imported.names
        });
      }
    });
    //export default class FoobarComponent extends InkDocument
    const component = source.addClass({
      name: classname,
      extends: 'InkDocument',
      isDefaultExport: true
    });
    //public id()
    component.addMethod({
      name: 'id',
      returnType: 'string',
      statements: `return '${this._component.id}';`
    });
    //public styles()
    component.addMethod({
      name: 'styles',
      returnType: 'string',
      statements: `return \`${styles.join('\n').trim()}\`;`
    });
    //public template()
    component.addMethod({
      name: 'template',
      statements: `
        ${scripts.join('\n')}
        return ${this.markup.trim()};
      `.trim()
    });

    return source;
  }

  /**
   * Returns a client script to be passed into the transpiled
   * render(client, props) method generated in transpile()
   * 
   * Primarily used by esInkPlugin which calls builder.client()
   */
  public client(bindings = '{}') {
    const { imports, scripts } = this._component;
    //only components (vs templates)
    const components = this._component.components.filter(
      component => component.type === 'component' 
        || component.type === 'external'
    );
    //all components and sub components
    const registry = Object.values(this._component.registry).filter(
      component => component.type === 'component'
        || component.type === 'external'
    )
    //create a new source file
    const { source } = this._createSourceFile('client.ts');
    //import type { Hash } from '@stackpress/ink/client';
    source.addImportDeclaration({
      isTypeOnly: true,
      moduleSpecifier: '@stackpress/ink/client',
      namedImports: [ 
        'Hash' 
      ]
    });
    //import InkException from '@stackpress/ink/dist/Exception';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ink/dist/Exception',
      defaultImport: 'InkException'
    });
    //import InkRegistry from '@stackpress/ink/dist/client/InkRegistry';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ink/dist/client/InkRegistry',
      defaultImport: 'InkRegistry'
    });
    //import emitter from '@stackpress/ink/dist/client/InkEmitter';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ink/dist/client/InkEmitter',
      defaultImport: 'emitter'
    });
    //import __APP_DATA__ from '@stackpress/ink/dist/client/data';
    source.addImportDeclaration({
      moduleSpecifier: '@stackpress/ink/dist/client/data',
      defaultImport: '__CLIENT_DATA__' 
    });
    //import Counter_abc123 from './Counter_abc123'
    registry.forEach(component => {
      let relative = path.relative(
        this._component.dirname, 
        component.absolute
      );
      if (!relative.startsWith('.')) {
        relative = `./${relative}`;
      }
      //now import
      source.addImportDeclaration({
        moduleSpecifier: relative,
        //we make sure there's no collisions
        //this is also matched when generating the component tree
        defaultImport: component.classname
      });
    });
    //import others from <script>
    imports.forEach(imported => {
      if (imported.default && imported.names) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: imported.source,
          defaultImport: imported.default,
          namedImports: imported.names
        });
      } else if (imported.default) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: imported.source,
          defaultImport: imported.default
        });
      } else if (imported.names) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: imported.source,
          namedImports: imported.names
        });
      }
    });

    //export { InkRegistry, emitter, __CLIENT_DATA__ as data };
    source.addExportDeclaration({
      namedExports: [
        'InkException',
        'InkRegistry',
        'emitter'
      ]
    });

    // export const components = { ... };
    source.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{
        name: 'components',
        initializer: `{
          ${registry.map(
            component => `'${component.classname}': ${component.classname}`
          ).join(',\n')}
        }`
      }]
    });
    // export const elements = { ... };
    source.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{
        name: 'elements',
        initializer: `{
          ${components.map(component => {
            const { brand, tagname, classname } = component;
            return brand 
              ? `'${brand}-${tagname}': ${classname}`
              : `'${tagname}': ${classname}`
          }).join(',\n')}
        }`
      }]
    });

    // export const data = __CLIENT_DATA__;
    source.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{
        name: 'data',
        initializer: '__CLIENT_DATA__'
      }]
    });

    // export const BUILD_ID = 'abc123';
    source.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      isExported: true,
      declarations: [{
        name: 'BUILD_ID',
        initializer: `'${this._component.id}'`
      }]
    });

    source.addStatements(`emitter.once('ready', () => {
      const script = document.querySelector('script[data-app]');
      if (!script) {
        throw InkException.for('APP_DATA not found');
      }
      try {
        const data = atob(script.getAttribute('data-app'));
        window.__APP_DATA__ = JSON.parse(data);
        Object.entries(window.__APP_DATA__).forEach(([key, value]) => {
          __CLIENT_DATA__.set(key, value);
        });
      } catch (error) {
        throw InkException.for('APP_DATA is not a valid JSON');
      }
      //set the current component
      __CLIENT_DATA__.set('current', 'document');
      //run the user entry script
      ${scripts.join('\n')}
      //reset the current component
      __CLIENT_DATA__.delete('current');
      //now serialize the props
      //this is predicting the order rendered on the server
      //with the order determined by doc.body.querySelectorAll
      const __BINDINGS__: Record<string, Record<string, any>> = ${bindings};
      //loop through the initial elements before js manipulation
      for (const element of document.body.querySelectorAll('*')) {
        //pull the attributes from the rendered HTML
        const attributes: Hash = Object.fromEntries(
          Array.from(element.attributes).map(attribute => [ 
            attribute.nodeName, 
            attribute.nodeValue.length > 0
              ? attribute.nodeValue
              : true
          ])
        );
        //determine the id of the element by its index in the registry
        const id = String(InkRegistry.elements.size);
        //if the element has bindings
        if (__BINDINGS__[id]) {
          //this is where we need to add the bindings to the attributes
          Object.assign(attributes, __BINDINGS__[id]);
        }
        //finally add the element to the registry
        InkRegistry.register(element, attributes);
      }
      //after we registered all the elements, we can now register the 
      //components and let it manip the HTML further if it wants to
      for (const [ tagname, definition ] of Object.entries(elements)) {
        if (!customElements.getName(definition)) {
          customElements.define(tagname, definition);
        }
      }
      //emit the mounted event
      emitter.emit('mounted', document.body);
    });`);

    return source;
  }

  /**
   * Generates the markup for a standard element
   */
  protected _markupElement(
    expression: string, 
    parent: MarkupToken|null,
    token: MarkupToken,
    components: Component[]
  ) {
    //check to see if the token refers to a 
    //component directly imported by this file
    const component = components.find(
      component => component.tagname === token.name
    );
    //if the token refers to a component imported by this file
    if (component) {
      if (component.type === 'template') {
        //templates take no children and scope is 
        //the same as the parent scope. template
        //tags are simply replaced with its children
        //syntax <x-head />
        //NOTE: if you want scoped templates, 
        // that's the same as a light component
        return expression + `...${this._markup(
          parent,
          component.ast.markup, 
          components
        )}`;
      }
      
      //business as usual...

      //get the tagname for the component
      const tagname = this._component.brand.length > 0 
        ? `${this._component.brand}-${token.name}`
        : token.name;
      //create the component
      expression += `InkRegistry.createElement('${tagname}', {`;
    } else {
      //check to see if the token refers to a 
      //template in the registry
      const template = this._component.components.find(
        component => component.tagname === token.name 
          && component.type === 'template'
      );
      if (template) {
        //templates take no children and scope is 
        //the same as the parent scope. template
        //tags are simply replaced with its children
        //syntax <x-head />
        //NOTE: if you want scoped templates, 
        // that's the same as a light component
        return expression + `...${this._markup(
          parent,
          template.ast.markup, 
          components
        )}`;
      }
      expression += `InkRegistry.createElement('${token.name}', {`;
    }
    
    if (token.attributes && token.attributes.properties.length > 0) {
      expression += ' ' + this._markupAttributes(token.attributes);
    }

    expression += ' }, \'{';

    if (token.attributes && token.attributes.properties.length > 0) {
      expression += ' ' + this._markupAttributes(token.attributes).replace(/'/g, '\\\'');
    }

    if (token.kind === 'inline') {
      expression += ' }\')';
    } else {
      expression += ' }\', ';
      if (token.children) {
        expression += this._markup(token, token.children, components);
      }
      expression += `)`;
    }
    
    return expression;
  }
}