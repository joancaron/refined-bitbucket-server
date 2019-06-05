import React from 'dom-chef';
import select from 'select-dom';

export const banner = text => {
  select('#header').prepend(
    <div
      className="aui-banner aui-banner-error"
      role="banner"
      aria-hidden="false"
    >
      {text}
    </div>
  );
};
