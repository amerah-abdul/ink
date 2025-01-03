<style>
  ::slotted(button), ::slotted(a) {
    cursor: pointer;
    background: transparent;
    border: 0;
    box-sizing: border-box;
    color: inherit;
    cursor: pointer;
    display: block;
    font-family: inherit;
    font-size: inherit;
    height: 100%;
    text-align: inherit;
    text-decoration: none;
    width: 100%;
  }
</style>
<script>
  import type { MouseEvent } from '@stackpress/ink/dist/types';
  import StyleSet from '@stackpress/ink/dist/style/StyleSet';
  import setColor from '../utilities/style/color';
  import setCurve from '../utilities/style/curve';
  import setDisplay from '../utilities/style/display';
  import setPadding from '../utilities/style/padding';
  import { removeEvents } from '../utilities/events';
  //extract props
  const { 
    //display
    flex, none, inline, block,
    'inline-block': iblock, 
    'inline-flex': iflex,
    //spacing
    padding, 
    'padding-x': paddingX, 
    'padding-y': paddingY,
    //font color
    color, white,   black, 
    info,  warning, success, 
    error, muted,   primary, 
    secondary, theme,
    //font size
    size, xs,  sm,  md,  lg, 
    xl,   xl2, xl3, xl4, xl5,
    //curve
    curve, curved, rounded, pill,
    //layouts
    outline, solid, transparent, 
    //others
    full, href,
    //dont need these
    style, 'class': _,
    //for the button
    ...attributes
  } = this.props;
  //override default styles
  const styles = new StyleSet();
  const css = this.styles();
  this.styles = () => css + styles.toString();
  //determine slotted selector
  const slotted = '::slotted(button), ::slotted(a)';
  //determine display
  setDisplay(this.props, styles, 'inline-block', ':host');
  //determine padding
  const pad = setPadding(this.props, styles, slotted);
  if (!pad) {
    //determine padding by size
    xs ? styles.add(slotted, 'padding', '2px 4px')
      : sm ? styles.add(slotted, 'padding', '5px 10px')
      : md ? styles.add(slotted, 'padding', '8px 16px')
      : lg ? styles.add(slotted, 'padding', '12px 24px')
      : xl ? styles.add(slotted, 'padding', '15px 30px')
      : xl2 ? styles.add(slotted, 'padding', '18px 36px')
      : xl3 ? styles.add(slotted, 'padding', '22px 44px')
      : xl4 ? styles.add(slotted, 'padding', '26px 52px')
      : xl5 ? styles.add(slotted, 'padding', '30px 60px')
      : null;
  }
  //determine curve
  setCurve(this.props, styles, false, ':host');
  //center
  styles.add(':host', 'text-align', 'center');
  //determine width
  if (full) {
    styles.add(':host', 'width', '100%');
  }
  //if outline or transparent
  if (outline || transparent) {
    setColor(this.props, styles, 'var(--muted)', ':host', 'color');
    setColor(this.props, styles, 'var(--muted)', ':host', 'border-color');
    styles.add(':host', 'border-style', 'solid');
    styles.add(':host', 'border-width', '1px');
    if (outline) {
      styles.add(':host', 'background-color', 'var(--white)');
    }
  //it's solid
  } else {
    styles.add(':host', 'color', 'var(--white)');
    setColor(this.props, styles, 'var(--muted)', ':host', 'background-color');
  }
  const children = this.getChildren(false);
  const attr = removeEvents(attributes);
</script>
<template type="light">
  <if true={href}>
    <a {...attr} {href}>{children}</a>
  <else />
    <button {...attr}>{children}</button>
  </if>
</template>
<template type="shadow">
  <slot></slot>
</template>