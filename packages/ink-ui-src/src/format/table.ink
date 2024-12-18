<script>
  import StyleSet from '@stackpress/ink/dist/style/StyleSet';
  import setColor from '../utilities/style/color';
  //extract props
  const { 
    value = [],
    //sticky
    top, left, right, 
    //styles
    padding, align,
    //colors for bg, head, stripe, border-top
    background, border, header, stripe
  } = this.propsTree;
  //override default styles
  const styles = new StyleSet();
  this.styles = () => styles.toString();
  //default host styles
  styles.add(':host', 'display', 'block');
  styles.add('table', 'width', '100%');
  styles.add('table', 'border', '0');
  styles.add('table', 'border-spacing', '0');
  //determine padding (Y)
  if (padding) {
    styles.add('td,th', 'padding', `${padding}px`);
  }
  //determine text alignment
  if (align) {
    styles.add('td,th', 'text-align', align);
  }
  //determine font color
  setColor(this.props, styles, false, ':host', 'color');
  //determine general background color
  if (background) {
    setColor(background, styles, false, 'td,th', 'background-color');
  }
  //determine head colors
  if (header) {
    setColor(background, styles, false, 'tr th', 'background-color');
  }
  //determine stripe colors
  if (stripe) {
    setColor(
      stripe, 
      styles, 
      false, 
      'tr:nth-child(even) td', 
      'background-color'
    );
  }
  //determine border top colors
  if (border) {
    styles.add('td', 'border-bottom-width', '0');
    styles.add('td', 'border-left-width', '0');
    styles.add('td', 'border-right-width', '0');
    styles.add('td', 'border-top-width', '1px');
    styles.add('td', 'border-top-style', 'solid');
    setColor(border, styles, false, 'td', 'border-top-color');
  }
  //sticky styles
  if (top || left || right) {
    styles.add('div', 'position', 'relative');
    styles.add('div', 'width', '100%');
    styles.add('div', 'height', '100%');
    styles.add('div', 'overflow', 'auto');
    if (top) {
      styles.add('th', 'position', 'sticky');
      styles.add('th', 'top', '0');
      styles.add('th', 'z-index', '1');
    }
    if (left) {
      styles.add('tr th:first-child, tr td:first-child', 'position', 'sticky');
      styles.add('tr th:first-child, tr td:first-child', 'left', '0');
      styles.add('tr th:first-child, tr td:first-child', 'z-index', '2');
    }
    if (right) {
      styles.add('tr th:last-child, tr td:last-child', 'position', 'sticky');
      styles.add('tr th:last-child, tr td:last-child', 'left', '0');
      styles.add('tr th:last-child, tr td:last-child', 'z-index', '2');
    }
    if (top && left) {
      styles.add('tr th:first-child', 'z-index', '3');
    }
    if (top && right) {
      styles.add('tr th:last-child', 'z-index', '3');
    }
  }

  const keys = value[0] ? Object.keys(value[0]): [];
  const entries = value.map(row => Object.values(row));
</script>
<div>
  <table>
    <thead>
      <tr>
        <each key=i value=label from=keys>
          <th>{label}</th>
        </each>
      </tr>
    </thead>
    <each value=row key=i from=entries>
      <tr>
        <each value=value from=row>
          <td>{value}</td>
        </each>
      </tr>
    </each>
  </table>
</div>