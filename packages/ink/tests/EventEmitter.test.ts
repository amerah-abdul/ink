import InkEventEmitter, { Event } from '../src/EventEmitter';
import { expect } from 'chai';

describe('Event', () => {
  it('should create an event with name and params', () => {
    const event = new Event('test', { foo: 'bar' });
    expect(event.name).to.equal('test');
    expect(event.params).to.deep.equal({ foo: 'bar' });
  });

  it('should create an event with default empty params', () => {
    const event = new Event('test');
    expect(event.params).to.deep.equal({});
  });

  it('should set and get data', () => {
    const event = new Event<string>('test');
    event.data = 'test-data';
    expect(event.data).to.equal('test-data');
  });

  it('should set data using set method', () => {
    const event = new Event<string>('test');
    event.set('test-data');
    expect(event.data).to.equal('test-data');
  });

  it('should add params using add method', () => {
    const event = new Event('test');
    event.add('key', 'value');
    expect(event.params.key).to.equal('value');
  });

  it('should chain set and add methods', () => {
    const event = new Event<string>('test');
    event.set('test-data').add('key', 'value');
    expect(event.data).to.equal('test-data');
    expect(event.params.key).to.equal('value');
  });
});

describe('InkEventEmitter', () => {
  let emitter: InkEventEmitter;

  beforeEach(() => {
    emitter = new InkEventEmitter();
  });

  it('should trigger an event and return event object', () => {
    let listenerCalled = false;
    let receivedEvent: Event<any> | null = null;
    
    emitter.on('test', (event) => {
      listenerCalled = true;
      receivedEvent = event;
    });
    
    const event = emitter.trigger('test', { foo: 'bar' });
    
    expect(event.name).to.equal('test');
    expect(event.params).to.deep.equal({ foo: 'bar' });
    expect(listenerCalled).to.be.true;
    expect(receivedEvent).to.equal(event);
  });

  it('should handle multiple listeners with waitFor', async () => {
    let listener1Called = false;
    let listener2Called = false;

    emitter.on('test', async (event: Event<string>) => {
      listener1Called = true;
      event.data = 'data1';
    });
    
    emitter.on('test', async (event: Event<string>) => {
      listener2Called = true;
      event.data = 'data2';
    });

    const event = await emitter.waitFor<string>('test', { foo: 'bar' });

    expect(listener1Called).to.be.true;
    expect(listener2Called).to.be.true;
    expect(event.data).to.equal('data2');
  });

  it('should handle async listeners in sequence', async () => {
    const sequence: number[] = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    emitter.on('test', async () => {
      await delay(10);
      sequence.push(1);
    });
    
    emitter.on('test', async () => {
      sequence.push(2);
    });

    await emitter.waitFor('test');

    expect(sequence).to.deep.equal([1, 2]);
  });

  it('should handle events without listeners', async () => {
    const event = await emitter.waitFor('test');
    expect(event.name).to.equal('test');
    expect(event.data).to.be.undefined;
  });
});
