import type { MarkupToken, LiteralToken } from '../src/types';

import { describe, it } from 'mocha';
import { expect } from 'chai';

import fs from 'fs';

import Tokenizer from '../src/compiler/Tokenizer';

describe('Ink Compiler Tokenizer', () => {
  it('Should tokenize Ink Page', () => {
    const actual = Tokenizer.tokenize(
      fs.readFileSync(__dirname + '/fixtures/page.ink', 'utf8')
    );
    //console.log('--page.ink--', JSON.stringify(actual, null, 2));
    expect(actual.components.length).to.equal(1);
    expect(actual.scripts.length).to.equal(1);
    expect(actual.styles.length).to.equal(1);
    expect(actual.markup.length).to.equal(3);
  });

  it('Should tokenize No Markup', () => {
    const actual = Tokenizer.tokenize(
      fs.readFileSync(__dirname + '/fixtures/footer.ink', 'utf8')
    );
    //console.log(JSON.stringify(actual, null, 2));
    expect(actual.components.length).to.equal(1);
    expect(actual.scripts.length).to.equal(1);
    expect(actual.styles.length).to.equal(1);
    expect(actual.markup.length).to.equal(2);

    const actual2 = Tokenizer.tokenize(
      fs.readFileSync(__dirname + '/fixtures/nomarkup.ink', 'utf8')
    );
    //console.log(JSON.stringify(actual2, null, 2));
    expect(actual2.components.length).to.equal(0);
    expect(actual2.scripts.length).to.equal(1);
    expect(actual2.styles.length).to.equal(0);
    expect(actual2.markup.length).to.equal(2);
  });

  it('Should tokenize Ink App', () => {
    const actual = Tokenizer.tokenize(
      fs.readFileSync(__dirname + '/fixtures/app.ink', 'utf8')
    );
    //console.log('--app.ink--', JSON.stringify(actual, null, 2));
    expect(actual.components.length).to.equal(3);
    expect(actual.scripts.length).to.equal(1);
    expect(actual.styles.length).to.equal(1);
    expect(actual.markup.length).to.equal(8);
  });

  it('Should tokenize link (inline) to style (block) issue', () => {
    const actual = Tokenizer.tokenize(
      fs.readFileSync(__dirname + '/fixtures/components/header.ink', 'utf8')
    );
    //console.log(JSON.stringify(actual, null, 2));
    expect(actual.components.length).to.equal(0);
    expect(actual.scripts.length).to.equal(1);
    expect(actual.styles.length).to.equal(1);
    expect(actual.markup.length).to.equal(2);
  });

  it('Should tokenize $', () => {
    const actual = Tokenizer.tokenize('<div><span>$</span>ok</div>');
    const markup = actual.markup[0].children?.[0] as MarkupToken;
    const literal = markup.children?.[0] as LiteralToken;
    //console.log(JSON.stringify(actual, null, 2));
    expect(markup.name).to.equal('span');
    expect(literal.value).to.equal('$');
  });
});