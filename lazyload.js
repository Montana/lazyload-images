import { preloadImage } from './utils';

/**
 * Observe images that doesn't match selector.
 *
 * @class
 * @classdesc If the image gets within 50px in the Y axis, start the download.
 */

export default class LazyLoadImages {

  constructor() {
    const images = document.getElementsByClassName('.js-lazy-image');
    const config = {
      rootMargin: '50px 0px',
      threshold: LazyLoadImages.THRESHOLD
    };

    if(!LazyLoadImages.SUPPORTS_INTERSECTION_OBSERVER) {
      this._loadImagesImmediately(images);
      return;
    }

    this._count = images.length;
    this._onIntersection = this._onIntersection.bind(this);
    this._observer = new IntersectionObserver(this._onIntersection, config);
    [...images].forEach(img => {
      if(img.classList.contains(LazyLoadImages.HANDLED_CLASS)) {
        return;
      }

      this._observer.observe(img);
    });
  }

  // check browser support
  static get SUPPORTS_INTERSECTION_OBSERVER() {
    return 'IntersectionObserver' in window;
  }

  // class with which to select images
  static get HANDLED_CLASS() {
    return 'js-lazy-image--handled';
  }

  // what % of visiblity of the target the observer should trigger
  static get THRESHOLD() {
    return 0.01;
  }

  // initialize new LazyLoadImages loader
  static init() {
    if(this._instance) {
      this._instance._disconnect();
    }

    this._count = 0;
    this._instance = new LazyLoadImages();
  }

  // disconnect LazyLoadImages loader
  // used if new LazyLoadImages() was called
  _disconnect() {
    if(!this._observer) {
      return;
    }

    this._observer.disconnect();
  }

  _onIntersection(entries) {
    entries.forEach(entry => {
      if(entry.intersectionRatio < 0) {
        return;
      }

      this._count--;
      this._observer.unobserve(entry.target);
      this._preloadImage(entry.target);
    });

    if(this._count > 0) {
      return;
    }

    this._observer.disconnect();
  }

  /**
   * Preloading image.
   *
   * @param {String} img - image to preload.
   */
  _preloadImage(img) {
    const src = img.dataset.src;
    if(!src) {
      return;
    }

    return preloadImage(src).then(() => this._applyImage(img, src));
  }

  /**
   * If IntersectionObserver API is not supported, load all images.
   *
   * @param {Array} images - images to add on the page.
   */
  _loadImagesImmediately(images) {
    [...images].forEach(image => this._preloadImage(image));
  }

  /**
   * Adding image on the page.
   *
   * @param {HTMLElement} _img - image to add on the page.
   * @param {String} src - image source path.
   */
  _applyImage(_img, src) {
    const el = _img.querySelector('.js-lazy-image-content');
    if(!el) {
      return;
    }

    // Prevent this from being lazy loaded a second time.
    _img.classList.add(LazyLoadImages.HANDLED_CLASS);
    el.style.backgroundImage = `url(${src})`;
    el.classList.add('fade-in');
  }
}
