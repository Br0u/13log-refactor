import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('../../app/components/HtmlContent', () => ({ default: ({html}) => <div dangerouslySetInnerHTML={{__html: html}} /> }));
vi.mock('../../components/ui/expand-map', () => ({ LocationMap: () => <div data-map>Toronto, Ontario</div> }));
vi.mock('../../components/about/AboutGuestbook', () => ({ default: () => <section>Guestbook</section> }));
vi.mock('../../components/about/AboutScroll', () => ({ default: ({children}) => <div>{children}</div> }));
vi.mock('../../lib/content', () => ({ getAboutPage: () => ({content: 'About body.\n<!-- photos -->\nAbout blog.'}), renderMarkdown: async s => `<p>${s}</p>` }));
vi.mock('../../lib/public-photos', () => ({ getPublicPhotoAlbumBySlug: vi.fn(async () => ({ photos: [{id:'cmmwmj8hx000q8oz2uk4feh9n', title:'Sunset', imageUrl:'/images/gallery/IMG_4256.jpg'}] })) }));
import AboutPage from '../../app/about/page';
import { getPublicPhotoAlbumBySlug } from '../../lib/public-photos';
describe('About paper journal', () => {
  it('keeps the reading order, one map, selected photo links and guestbook', async () => {
    const html = renderToStaticMarkup(await AboutPage());
    expect(html).toContain('<h1');
    expect(html).toContain('Brou');
    expect(html).toContain('href="#about-body"');
    expect(html).toContain('class="skip-link ');
    expect((html.match(/data-map/g)||[])).toHaveLength(1);
    expect(html.indexOf('About body.')).toBeLessThan(html.indexOf('照片小记'));
    expect(html.indexOf('照片小记')).toBeLessThan(html.indexOf('About blog.'));
    expect(html.indexOf('About blog.')).toBeLessThan(html.indexOf('data-map'));
    expect(html.indexOf('data-map')).toBeLessThan(html.indexOf('Guestbook'));
    expect(html).toContain('href="/photos/random"');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain('about-note-layout');
  });
  it('omits missing or unpublished photographs without losing the note', async () => {
    getPublicPhotoAlbumBySlug.mockResolvedValueOnce(null);
    const html = renderToStaticMarkup(await AboutPage());
    expect(html).not.toContain('aria-label="照片小记"');
    expect(html).toContain('About body.');
    expect(html).toContain('Guestbook');
  });
});
