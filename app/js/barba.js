import Barba from 'barba.js';
import { TimelineMax } from 'gsap';
import { prevAll, nextAll } from './util';

let lastClickedElement;
let lastClickedElementId;
let scrollPos;
Barba.Dispatcher.on('linkClicked', el => {
  lastClickedElement = el;
  lastClickedElementId = el.id;
  scrollPos = document.querySelector('.items').scrollLeft;
});

const ItemsTransition = Barba.BaseTransition.extend({
  start: function() {
    Promise.all([this.newContainerLoading, this.customFn()]).then(
      this.showNewPage.bind(this)
    );
  },
  customFn: function() {
    const deferred = Barba.Utils.deferred();
    const tl = new TimelineMax();

    const prevItems = prevAll(lastClickedElement);
    const nextItems = nextAll(lastClickedElement);

    const left = lastClickedElement.getBoundingClientRect().left;
    const clone = lastClickedElement.cloneNode(true);
    const cloneBg = clone.querySelector('.item__bg');
    const cloneTitle = clone.querySelector('.item__title span.second');
    const cloneTitleCover = clone.querySelector('.item__title-cover');

    clone.classList.add('is-clone');
    this.oldContainer.appendChild(clone);

    const screenWidth = window.innerWidth;
    const itemWidth = lastClickedElement.getBoundingClientRect().width;
    const prevItemsLeft = prevItems[0]
      ? itemWidth + prevItems[0].getBoundingClientRect().left
      : 0;
    const nextItemsLeft = nextItems[0]
      ? screenWidth - nextItems[0].getBoundingClientRect().left
      : 0;

    // Анимация всех prev/next элементов
    // tl.to(prevItems, 1, { x: -prevItemsLeft }, 0);
    // tl.to(nextItems, 1, { x: nextItemsLeft }, 0);

    const easing = Power4.easeInOut;
    tl.set(clone, { x: left });
    tl
      .to(clone, 1, {
        ease: easing,
        x: 0,
        width: screenWidth
      })
      .to(cloneBg, 1, { x: 0, ease: easing }, '-=1')
      .staggerTo(
        prevItems,
        1,
        {
          ease: easing,
          cycle: {
            x: n => {
              if (n < 3) return -prevItemsLeft;
            }
          }
        },
        0,
        '-=1'
      )
      .staggerTo(
        nextItems,
        1,
        {
          ease: easing,
          cycle: {
            x: n => {
              if (n < 3) return nextItemsLeft;
            }
          }
        },
        0,
        '-=1'
      )
      .to(
        cloneTitleCover,
        0.3,
        {
          y: '0%'
        },
        '-=1'
      )
      .to(
        cloneTitleCover,
        0.3,
        {
          y: '100%',
          onStart: () => {
            cloneTitle.style.opacity = '0';
          },
          onComplete: () => {
            deferred.resolve();

            TweenMax.set('.single__title span', { opacity: 0 });
            const singleTl = new TimelineMax();
            singleTl
              .to('.single__title-cover', 0.4, {
                y: '0%',
                ease: easing,
                onComplete: () => {
                  TweenMax.set('.single__title span', { opacity: 1 });
                }
              })
              .to('.single__title-cover', 0.3, { y: '-110%', ease: easing });
          }
        },
        '-=0.6'
      );

    return deferred.promise;
  },
  showNewPage: function() {
    this.done();
  }
});

const BackTransition = Barba.BaseTransition.extend({
  start: function() {
    Promise.all([this.newContainerLoading, this.customFn()]).then(
      this.showNewPage.bind(this)
    );
  },
  customFn: function() {
    const deferred = Barba.Utils.deferred();

    const easing = Power4.easeInOut;
    const singleTl = new TimelineMax();

    singleTl
      .to('.single__title-cover', 0.4, {
        y: '0%',
        ease: easing,
        onComplete: () => {
          TweenMax.set('.single__title span', { opacity: 0 });
        }
      })
      .to('.single__title-cover', 0.3, {
        y: '110%',
        ease: easing,
        onComplete: () => {
          deferred.resolve();

          lastClickedElement = document.getElementById(lastClickedElementId);

          const itemWidth = lastClickedElement.getBoundingClientRect().width;

          const prevItems = prevAll(lastClickedElement);
          const nextItems = nextAll(lastClickedElement);

          const clone = lastClickedElement.cloneNode(true);
          const cloneBg = clone.querySelector('.item__bg');
          const cloneTitleFirst = clone.querySelectorAll(
            '.item__title span.first'
          );
          const cloneTitleSecond = clone.querySelectorAll(
            '.item__title span.second'
          );
          const cloneTitleCover = clone.querySelector('.item__title-cover');

          clone.classList.add('is-clone');
          clone.classList.add('is-clone--back');
          TweenMax.set([cloneTitleFirst, cloneTitleSecond], {
            opacity: 0
          });

          this.newContainer.appendChild(clone);

          document.querySelector('.items').scrollLeft = scrollPos;

          const left = lastClickedElement.getBoundingClientRect().left;
          const backTl = new TimelineMax();
          backTl
            .to(cloneTitleCover, 0.4, {
              y: '0%',
              onComplete: () => {
                TweenMax.set([cloneTitleFirst, cloneTitleSecond], {
                  opacity: 1
                });
              }
            })
            .to(cloneTitleCover, 0.4, { y: '110%' })
            .to(
              clone,
              1,
              {
                ease: easing,
                x: left,
                width: itemWidth
              },
              '-=1'
            )
            .to(
              cloneBg,
              1,
              {
                x: '-35%',
                ease: easing,
                onComplete: () => {
                  clone.parentNode.removeChild(clone);
                }
              },
              '-=1'
            );
        }
      });

    return deferred.promise;
  },
  showNewPage: function() {
    this.done();
  }
});

Barba.Pjax.getTransition = () => {
  const from = Barba.HistoryManager.prevStatus().namespace;
  let transitionObj = from === 'inner' ? BackTransition : ItemsTransition;
  return transitionObj;
};
Barba.Pjax.start();
