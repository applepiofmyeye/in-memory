class ScrapbookController {
  constructor(book) {
    this.book = book;
    this.leaves = [...book.querySelectorAll('.leaf')];
    this.current = 0;
    this.drag = null;
    this.duration = 650;
    this.prevBtn = document.querySelector('#prevBtn');
    this.nextBtn = document.querySelector('#nextBtn');
    this.status = document.querySelector('#pageStatus');

    this.leaves.forEach((leaf, index) => {
      leaf.style.zIndex = String(this.leaves.length - index + 2);
      leaf.addEventListener('pointerdown', (event) => this.onPointerDown(event, index));
    });

    window.addEventListener('pointermove', (event) => this.onPointerMove(event), { passive: false });
    window.addEventListener('pointerup', (event) => this.onPointerUp(event));
    window.addEventListener('pointercancel', (event) => this.onPointerUp(event));
    this.prevBtn.addEventListener('click', () => this.previous());
    this.nextBtn.addEventListener('click', () => this.next());
    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') this.next();
      if (event.key === 'ArrowLeft') this.previous();
    });
    this.refresh();
  }

  onPointerDown(event, index) {
    const isForward = index === this.current;
    const isBackward = index === this.current - 1;
    if (!isForward && !isBackward) return;

    const rect = this.book.getBoundingClientRect();
    this.drag = {
      pointerId: event.pointerId,
      index,
      startX: event.clientX,
      startY: event.clientY,
      rect,
      direction: isForward ? 'forward' : 'backward'
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.classList.add('is-dragging');
  }

  onPointerMove(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.preventDefault();
    const leaf = this.leaves[this.drag.index];
    const dx = event.clientX - this.drag.startX;
    const dy = event.clientY - this.drag.startY;
    const width = Math.max(1, this.drag.rect.width / (matchMedia('(max-width: 760px)').matches ? 1 : 2));
    const verticalInfluence = Math.max(-12, Math.min(12, (dy / this.drag.rect.height) * 18));

    let progress;
    if (this.drag.direction === 'forward') {
      progress = Math.max(0, Math.min(1, -dx / width));
      leaf.style.transform = `rotateY(${-180 * progress}deg) rotateZ(${verticalInfluence * progress}deg)`;
    } else {
      progress = Math.max(0, Math.min(1, dx / width));
      leaf.style.transform = `rotateY(${-180 + 180 * progress}deg) rotateZ(${-verticalInfluence * (1 - progress)}deg)`;
    }
    this.drag.progress = progress;

    if (progress > .5) {
      leaf.style.zIndex = String(this.leaves.length + 10);
    } else {
      leaf.style.zIndex = String(this.leaves.length - this.drag.index + 2);
    }
  }

  onPointerUp(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const { index, direction, progress = 0 } = this.drag;
    const leaf = this.leaves[index];
    leaf.classList.remove('is-dragging');
    leaf.style.transform = '';

    if (direction === 'forward' && progress > .28) this.flipForward(index);
    else if (direction === 'backward' && progress > .28) this.flipBackward(index);
    else this.refresh();

    this.drag = null;
  }

  flipForward(index) {
    if (index !== this.current || this.current >= this.leaves.length) return;
    const leaf = this.leaves[index];
    leaf.style.zIndex = String(this.leaves.length + 10);
    requestAnimationFrame(() => leaf.classList.add('is-flipped'));
    setTimeout(() => {
      this.current += 1;
      this.refresh();
    }, this.duration * .52);
  }

  flipBackward(index) {
    if (index !== this.current - 1 || this.current <= 0) return;
    const leaf = this.leaves[index];
    leaf.style.zIndex = String(this.leaves.length + 10);
    requestAnimationFrame(() => leaf.classList.remove('is-flipped'));
    setTimeout(() => {
      this.current -= 1;
      this.refresh();
    }, this.duration * .52);
  }

  next() { if (this.current < this.leaves.length) this.flipForward(this.current); }
  previous() { if (this.current > 0) this.flipBackward(this.current - 1); }

  refresh() {
    this.leaves.forEach((leaf, index) => {
      const flipped = index < this.current;
      leaf.classList.toggle('is-flipped', flipped);
      leaf.classList.toggle('is-active', index === this.current);
      leaf.style.transform = '';
      leaf.style.zIndex = flipped
        ? String(index + 1)
        : String(this.leaves.length - index + 2);
    });
    this.prevBtn.disabled = this.current === 0;
    this.nextBtn.disabled = this.current === this.leaves.length;
    const visiblePage = Math.min(this.current * 2 + 1, this.leaves.length * 2);
    this.status.textContent = `${visiblePage} / ${this.leaves.length * 2}`;
  }
}

const controller = new ScrapbookController(document.querySelector('#book'));

const video = document.querySelector('#memoryVideo');
const placeholder = document.querySelector('.video-placeholder');
const playNote = document.querySelector('#playNote');
video.addEventListener('loadeddata', () => placeholder.hidden = true);
video.addEventListener('error', () => placeholder.hidden = false);
playNote.addEventListener('click', async () => {
  if (!video.currentSrc || video.error) return;
  if (video.paused) await video.play(); else video.pause();
  playNote.firstChild.textContent = video.paused ? 'press play ' : 'pause ';
});