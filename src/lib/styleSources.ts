export const STYLE_FEEDS = [
  { name: 'Vogue',            url: 'https://www.vogue.com/feed/rss'                                       },
  { name: "Harper's Bazaar",  url: 'https://www.harpersbazaar.com/rss/all.xml/'                           },
  { name: 'Who What Wear',    url: 'https://www.whowhatwear.com/rss'                                      },
  { name: 'The Cut',          url: 'https://www.thecut.com/rss/index.xml'                                 },
  { name: 'Daily Mail',       url: 'https://www.dailymail.co.uk/femail/index.rss'                         },
  { name: 'Daily Mail',       url: 'https://www.dailymail.co.uk/tvshowbiz/index.rss'                      },
  { name: 'People',           url: 'https://people.com/feed/'                                             },
  { name: 'E! Online',        url: 'https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml'    },
] as const;

// Unique display names for the UI toggle list
export const UNIQUE_SOURCE_NAMES = STYLE_FEEDS.map(f => f.name).filter(
  (name, i, arr) => arr.indexOf(name) === i
);

export type SourcePrefs = Record<string, boolean>;

export function defaultPrefs(): SourcePrefs {
  return Object.fromEntries(UNIQUE_SOURCE_NAMES.map(name => [name, true]));
}

export interface CustomSource {
  url: string;
  name: string;
  enabled: boolean;
}

export const CUSTOM_SOURCES_KEY = 'polly_custom_sources';
