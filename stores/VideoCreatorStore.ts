import { makeAutoObservable, runInAction } from 'mobx';
import { v4 as uuid } from 'uuid';
import { Renderer } from '../renderer/Renderer';
import { RendererState } from '../renderer/RendererState';
import { ElementState } from '../renderer/ElementState';
import { groupBy } from '../utility/groupBy';
import { deepClone } from '../utility/deepClone';

class VideoCreatorStore {
  renderer?: Renderer = undefined;

  state?: RendererState = undefined;

  tracks?: Map<number, ElementState[]> = undefined;

  activeElementIds: string[] = [];

  isLoading = true;

  isPlaying = false;

  time = 0;

  timelineScale = 100;

  isScrubbing = false;

  constructor() {
    makeAutoObservable(this);
  }

  initializeVideoPlayer(htmlElement: HTMLDivElement) {
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = undefined;
    }

    const renderer = new Renderer(htmlElement, 'interactive', 'YOUR_PUBLIC_TOKEN_HERE');

    this.renderer = renderer;

    renderer.onReady = async () => {
      await renderer.setSource(this.getDefaultSource());
    };

    renderer.onLoad = async () => {
      runInAction(() => (this.isLoading = true));
    };

    renderer.onLoadComplete = async () => {
      runInAction(() => (this.isLoading = false));
    };

    renderer.onPlay = () => {
      runInAction(() => (this.isPlaying = true));
    };

    renderer.onPause = () => {
      runInAction(() => (this.isPlaying = false));
    };

    renderer.onTimeChange = (time) => {
      if (!this.isScrubbing) {
        runInAction(() => (this.time = time));
      }
    };

    renderer.onActiveElementsChange = (elementIds) => {
      runInAction(() => (this.activeElementIds = elementIds));
    };

    renderer.onStateChange = (state) => {
      runInAction(() => {
        this.state = state;
        this.tracks = groupBy(state.elements, (element) => element.track);
      });
    };
  }

  async setTime(time: number): Promise<void> {
    this.time = time;
    await this.renderer?.setTime(time);
  }

  async setActiveElements(...elementIds: string[]): Promise<void> {
    this.activeElementIds = elementIds;
    await this.renderer?.setActiveElements(elementIds);
  }

  getActiveElement(): ElementState | undefined {
    if (!this.renderer || this.activeElementIds.length === 0) {
      return undefined;
    }

    const id = videoCreator.activeElementIds[0];
    return this.renderer.findElement((element) => element.source.id === id, this.state);
  }

  async createElement(elementSource: Record<string, any>): Promise<void> {
    const renderer = this.renderer;
    if (!renderer || !renderer.state) {
      return;
    }

    const source = renderer.getSource();
    const newTrack = Math.max(...renderer.state.elements.map((element) => element.track)) + 1;

    const id = uuid();

    source.elements.push({
      id,
      track: newTrack,
      ...elementSource,
    });

    await renderer.setSource(source, true);

    await this.setActiveElements(id);
  }

  async deleteElement(elementId: string): Promise<void> {
    const renderer = this.renderer;
    if (!renderer || !renderer.state) {
      return;
    }

    // Clone the current renderer state
    const state = deepClone(renderer.state);

    // Remove the element
    state.elements = state.elements.filter((element) => element.source.id !== elementId);

    // Set source by the mutated state
    await renderer.setSource(renderer.getSource(state), true);
  }

  async rearrangeTracks(track: number, direction: 'up' | 'down'): Promise<void> {
    const renderer = this.renderer;
    if (!renderer || !renderer.state) {
      return;
    }

    // The track number to swap with
    const targetTrack = direction === 'up' ? track + 1 : track - 1;
    if (targetTrack < 1) {
      return;
    }

    // Elements at provided track
    const elementsCurrentTrack = renderer.state.elements.filter((element) => element.track === track);
    if (elementsCurrentTrack.length === 0) {
      return;
    }

    // Clone the current renderer state
    const state = deepClone(renderer.state);

    // Swap track numbers
    for (const element of state.elements) {
      if (element.track === track) {
        element.source.track = targetTrack;
      } else if (element.track === targetTrack) {
        element.source.track = track;
      }
    }

    // Set source by the mutated state
    await renderer.setSource(renderer.getSource(state), true);
  }

  async finishVideo(): Promise<any> {
    const renderer = this.renderer;
    if (!renderer) {
      return;
    }

    const response = await fetch('/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: renderer.getSource(),
      }),
    });

    return await response.json();
  }

  getDefaultSource() {
    // Replace this with your own JSON source

    return {
      output_format: 'mp4',
      width: 1920,
      height: 1080,
      frame_rate: '60 fps',
      duration: '11.5 s',
      snapshot_time: '3.78 s',
      elements: [
        {
          id: 'e11cc686-d6da-4bc9-a830-64142202d3cf',
          type: 'shape',
          track: 2,
          time: '0 s',
          width: '100%',
          height: '100.0001%',
          x_anchor: '50%',
          y_anchor: '50%',
          fill_color: [
            {
              time: '0 s',
              value: '#000000',
            },
            {
              time: '4.345 s',
              easing: 'steps',
              value: '#ffffff',
            },
          ],
          path: 'M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z',
        },
        {
          id: 'ecf1a01d-ff16-4b5f-a58c-a4998b02e502',
          type: 'video',
          track: 3,
          time: '0 s',
          duration: '5.89 s',
          dynamic: true,
          width: [
            {
              time: '0 s',
              easing: 'steps(1)',
              value: '45.2062%',
            },
            {
              time: '0.5 s',
              easing: 'steps(1)',
              value: '78.9826%',
            },
            {
              time: '0.9 s',
              easing: 'steps(1)',
              value: '85.0283%',
            },
            {
              time: '1.2 s',
              easing: 'steps(1)',
              value: '100%',
            },
            {
              time: '4.457 s',
              easing: 'steps(1)',
              value: '78.9826%',
            },
          ],
          height: [
            {
              time: '0 s',
              easing: 'steps(1)',
              value: '45.2062%',
            },
            {
              time: '0.5 s',
              easing: 'steps(1)',
              value: '78.9826%',
            },
            {
              time: '0.9 s',
              easing: 'steps(1)',
              value: '85.0283%',
            },
            {
              time: '1.2 s',
              easing: 'steps(1)',
              value: '100%',
            },
            {
              time: '4.457 s',
              easing: 'steps(1)',
              value: '78.9826%',
            },
          ],
          clip: true,
          color_filter: [
            {
              time: '3.078 s',
              easing: 'steps',
              value: 'invert',
            },
            {
              time: '3.261 s',
              easing: 'steps',
              value: 'grayscale',
            },
            {
              time: '3.771 s',
              value: 'grayscale',
            },
            {
              time: '4.457 s',
              easing: 'steps',
              value: 'none',
            },
          ],
          color_filter_value: [
            {
              time: '3.078 s',
              easing: 'steps',
              value: '0%',
            },
            {
              time: '3.261 s',
              easing: 'steps',
              value: '100%',
            },
            {
              time: '3.771 s',
              value: '100%',
            },
            {
              time: '4.457 s',
              easing: 'steps',
              value: '100%',
            },
          ],
          color_overlay: [
            {
              time: '3.078 s',
              value: 'rgba(244,65,80,0)',
            },
            {
              time: '3.26 s',
              easing: 'steps',
              value: 'rgba(244,65,80,0.6)',
            },
            {
              time: '3.771 s',
              easing: 'steps',
              value: 'rgba(244,65,80,0)',
            },
            {
              time: '4.457 s',
              easing: 'steps',
              value: 'rgba(244,65,80,0)',
            },
          ],
          blur_radius: [
            {
              time: 'start',
              easing: 'steps',
              value: 20,
            },
            {
              time: '0.5 s',
              easing: 'steps',
              value: 10,
            },
            {
              time: '0.9 s',
              value: 0,
            },
          ],
          source: '7347c3b7-e1a8-4439-96f1-f3dfc95c3d28',
          trim_start: '0 s',
          loop: true,
        },
        {
          id: '6ecfa5bd-4a8f-4891-9001-b1d4239f0d1c',
          type: 'shape',
          track: 3,
          time: '4.89 s',
          width: [
            {
              time: '0.84 s',
              easing: 'steps(1)',
              value: '78.9826%',
            },
            {
              time: '1.19 s',
              easing: 'steps(1)',
              value: '85.0283%',
            },
            {
              time: '1.49 s',
              easing: 'steps(1)',
              value: '100%',
            },
          ],
          height: [
            {
              time: '0.84 s',
              easing: 'steps(1)',
              value: '78.9826%',
            },
            {
              time: '1.19 s',
              easing: 'steps(1)',
              value: '85.0283%',
            },
            {
              time: '1.49 s',
              easing: 'steps(1)',
              value: '100%',
            },
          ],
          x_anchor: '50%',
          y_anchor: '50%',
          fill_color: '#000000',
          animations: [
            {
              time: 'start',
              duration: '1 s',
              transition: true,
              type: 'flip',
              fade: false,
              y_rotation: '-180°',
            },
          ],
          path: 'M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z',
        },
        {
          id: '54f16c97-bcb1-4cab-9c64-3b763bcc4b89',
          name: 'Text-1',
          type: 'text',
          track: 4,
          time: '1.8242 s',
          duration: '2.7058 s',
          dynamic: true,
          width: '91.8839%',
          height: '83.2626%',
          x_scale: [
            {
              time: '1.726 s',
              easing: 'steps',
              value: '100%',
            },
            {
              time: '1.947 s',
              easing: 'steps',
              value: '50%',
            },
          ],
          y_scale: [
            {
              time: '1.726 s',
              easing: 'steps',
              value: '100%',
            },
            {
              time: '1.947 s',
              easing: 'steps',
              value: '50%',
            },
          ],
          x_alignment: '50%',
          y_alignment: '50%',
          fill_color: '#ffffff',
          mask_mode: [
            {
              time: '1.203 s',
              value: 'alpha',
            },
            {
              time: '1.436 s',
              value: null,
            },
          ],
          animations: [
            {
              time: 'start',
              duration: '0.6014 s',
              easing: 'quadratic-out',
              type: 'text-fly',
              split: 'word',
              track: 0,
            },
            {
              time: 'end',
              duration: '0.6263 s',
              easing: 'quadratic-out',
              reversed: true,
              type: 'text-wave',
              order: 'random',
              split: 'letter',
            },
          ],
          text: 'Your Text And Video Here',
          font_weight: '800',
          line_height: '87%',
        },
        {
          id: '00c1c5a0-59c9-43c2-a3a9-af5f59f255b5',
          name: 'Text-2',
          type: 'text',
          track: 4,
          time: '5.38 s',
          duration: '2.7862 s',
          dynamic: true,
          y: '53.9933%',
          width: '76.9299%',
          height: '47.1794%',
          x_scale: [
            {
              time: '0 s',
              value: '100%',
            },
            {
              time: 'end',
              easing: 'linear',
              value: '120%',
            },
          ],
          y_scale: [
            {
              time: 'start',
              value: '100%',
            },
            {
              time: 'end',
              easing: 'linear',
              value: '120%',
            },
          ],
          x_alignment: '50%',
          y_alignment: '50%',
          fill_color: [
            {
              time: 'start',
              easing: 'linear',
              value: [
                {
                  offset: '0%',
                  color: '#5352ed',
                },
                {
                  offset: '100%',
                  color: 'rgba(132,0,11,1)',
                },
              ],
            },
            {
              time: '0.558 s',
              easing: 'linear',
              value: [
                {
                  offset: '0%',
                  color: 'rgba(255,71,87,1)',
                },
                {
                  offset: '100%',
                  color: '#84000b',
                },
              ],
            },
            {
              time: '1.123 s',
              easing: 'linear',
              value: [
                {
                  offset: '0%',
                  color: '#5352ed',
                },
                {
                  offset: '100%',
                  color: 'rgba(132,0,11,1)',
                },
              ],
            },
            {
              time: '1.599 s',
              easing: 'linear',
              value: [
                {
                  offset: '0%',
                  color: 'rgba(255,71,87,1)',
                },
                {
                  offset: '100%',
                  color: '#84000b',
                },
              ],
            },
          ],
          fill_mode: 'linear',
          fill_x0: [
            {
              time: '0 s',
              easing: 'linear',
              value: '87.7128%',
            },
            {
              time: '0.558 s',
              easing: 'linear',
              value: '5.6676%',
            },
            {
              time: '1.123 s',
              easing: 'linear',
              value: '87.7128%',
            },
            {
              time: '1.599 s',
              easing: 'linear',
              value: '5.6676%',
            },
          ],
          fill_y0: [
            {
              time: '0 s',
              easing: 'linear',
              value: '111.6481%',
            },
            {
              time: '0.558 s',
              easing: 'linear',
              value: '90.1325%',
            },
            {
              time: '1.123 s',
              easing: 'linear',
              value: '111.6481%',
            },
            {
              time: '1.599 s',
              easing: 'linear',
              value: '90.1325%',
            },
          ],
          fill_x1: [
            {
              time: '0 s',
              easing: 'linear',
              value: '10.883%',
            },
            {
              time: '0.558 s',
              easing: 'linear',
              value: '95.9372%',
            },
            {
              time: '1.123 s',
              easing: 'linear',
              value: '10.883%',
            },
            {
              time: '1.599 s',
              easing: 'linear',
              value: '95.9372%',
            },
          ],
          fill_y1: [
            {
              time: '0 s',
              easing: 'linear',
              value: '-15.7186%',
            },
            {
              time: '0.558 s',
              easing: 'linear',
              value: '-14.5556%',
            },
            {
              time: '1.123 s',
              easing: 'linear',
              value: '-15.7186%',
            },
            {
              time: '1.599 s',
              easing: 'linear',
              value: '-14.5556%',
            },
          ],
          animations: [
            {
              time: 'start',
              duration: '0.6014 s',
              easing: 'quadratic-out',
              type: 'text-fly',
              split: 'word',
              track: 0,
            },
            {
              time: 'end',
              duration: '1 s',
              easing: 'quadratic-out',
              reversed: true,
              type: 'text-slide',
              scope: 'split-clip',
              split: 'letter',
              direction: 'up',
            },
          ],
          text: 'Create & Automate\n[size 150%]Video[/size]',
          font_weight: '800',
          letter_spacing: '-19%',
          line_height: '96%',
        },
        {
          id: '88f23609-cdd7-41d7-96a8-aa7ab0c21ac8',
          type: 'composition',
          track: 4,
          time: '8.2803 s',
          width: '46.1105%',
          height: '14.4045%',
          x_scale: [
            {
              time: '1.831 s',
              easing: 'steps',
              value: '100%',
            },
            {
              time: '2.105 s',
              easing: 'steps',
              value: '127%',
            },
            {
              time: '2.327 s',
              easing: 'steps',
              value: '75%',
            },
          ],
          y_scale: [
            {
              time: '1.831 s',
              easing: 'steps',
              value: '100%',
            },
            {
              time: '2.105 s',
              easing: 'steps',
              value: '127%',
            },
            {
              time: '2.327 s',
              easing: 'steps',
              value: '75%',
            },
          ],
          animations: [
            {
              time: 'start',
              duration: '0.9661 s',
              easing: 'back-out',
              type: 'slide',
              distance: '30%',
              direction: '180°',
            },
          ],
          elements: [
            {
              id: 'def71fed-c745-4f97-a9b9-7f4280b039ce',
              type: 'shape',
              track: 1,
              time: '0 s',
              x: '8.0366%',
              width: '16.0731%',
              height: '100%',
              aspect_ratio: 0.8134,
              x_anchor: '50%',
              y_anchor: '50%',
              fill_color: '#ffffff',
              path: 'M 56.4198 14.5533 L 56.4198 0 L 0 0 L 0 100 L 56.4198 100 L 56.4198 85.4467 C 44.8629 85.4467 33.7773 81.71 25.6055 75.0633 C 17.4337 68.4167 12.8437 59.4 12.8437 50 C 12.8437 40.6 17.4337 31.5833 25.6055 24.9367 C 33.7773 18.29 44.8629 14.5533 56.4198 14.5533 Z M 56.4198 14.5533 L 56.4198 85.4467 C 67.9767 85.4467 79.0623 81.71 87.2341 75.0633 C 95.4059 68.4167 100 59.4 100 50 C 100 40.6 95.4059 31.5833 87.2341 24.9367 C 79.0623 18.29 67.9767 14.5533 56.4198 14.5533 Z',
            },
            {
              id: 'c2edc7b3-db26-474e-aac7-3ab72dcce3c7',
              type: 'text',
              track: 2,
              time: '0.86 s',
              x: '59.3495%',
              width: '81.3009%',
              height: '100%',
              x_alignment: '50%',
              y_alignment: '50%',
              fill_color: '#ffffff',
              animations: [
                {
                  time: 'start',
                  duration: '0.4867 s',
                  easing: 'quadratic-out',
                  type: 'text-spin',
                  split: 'letter',
                  direction: 'up',
                },
              ],
              text: 'Your Logo',
              font_weight: '800',
              letter_spacing: '-19%',
              line_height: '96%',
              text_wrap: false,
            },
          ],
        },
      ],
    };
  }
}

export const videoCreator = new VideoCreatorStore();
