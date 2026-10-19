/** Theme palettes. Source of truth: the approved theme-settings mock (P array).
 *  Each token `k` is written as `--mp-<k>` on <html> by ThemeService. */
export type ThemeTokenKey = 'sidebar' | 'sidebar-fg' | 'sidebar-accent' | 'sidebar-accent-fg' | 'primary' | 'primary-fg'
  | 'accent' | 'bg' | 'surface' | 'ink' | 'soft' | 'line' | 'band' | 'strong' | 'danger'
  | 'primary-soft' | 'accent-soft';

export interface ThemePalette {
  id: string;
  name: string;
  src: string;
  sw: string[];
  t: Record<ThemeTokenKey, string>;
  /** Five chart series colours (written as --mp-chart-1..5), drawn from the swatches. */
  chart: string[];
}

export const PALETTES: ThemePalette[] = [
 {id:'classic',name:'Classic',src:'house greyscale (today)',sw:['#0A0A0A','#6B6B6B','#DADADA','#F3F3F3','#FAFAFA'],
  t:{sidebar:'#0A0A0A','sidebar-fg':'#DEDEDE','sidebar-accent':'#262626','sidebar-accent-fg':'#FFFFFF',primary:'#0A0A0A','primary-fg':'#FFFFFF',accent:'#6B6B6B',bg:'#FAFAFA',surface:'#FFFFFF',ink:'#0A0A0A',soft:'#6B6B6B',line:'#DADADA',band:'#F3F3F3',strong:'#BDBDBD',danger:'#C62828','primary-soft':'#EFEFEF','accent-soft':'#E8E8E8'},
  chart:['#0A0A0A','#6B6B6B','#9E9E9E','#C8C8C8','#DADADA']},
 {id:'rose',name:'Rosé',src:'Pink palette pin · Soft Pink, Cotton Candy, Pink, Bordeaux',sw:['#5A0016','#EA8EA8','#FFC9E2','#FEF1F7','#FFFFFF'],
  t:{sidebar:'#5A0016','sidebar-fg':'#F3D6DE','sidebar-accent':'#7A1A33','sidebar-accent-fg':'#FFFFFF',primary:'#5A0016','primary-fg':'#FFFFFF',accent:'#EA8EA8',bg:'#FFF8FB',surface:'#FFFFFF',ink:'#2A0A12',soft:'#8A5A68',line:'#F0CDDA',band:'#FEF1F7',strong:'#E9A9C0',danger:'#B3001B','primary-soft':'#EEE6E8','accent-soft':'#FCEFF3'},
  chart:['#5A0016','#A3324F','#EA8EA8','#F4B3CB','#FFC9E2']},
 {id:'beach',name:'Beach Sunset',src:'Beach pin · #285260 #548C92 #B4D7D8 #E0D7CF #AB9072',sw:['#285260','#548C92','#B4D7D8','#E0D7CF','#AB9072'],
  t:{sidebar:'#285260','sidebar-fg':'#CFE0E3','sidebar-accent':'#548C92','sidebar-accent-fg':'#FFFFFF',primary:'#285260','primary-fg':'#FFFFFF',accent:'#AB9072',bg:'#F7F4F1',surface:'#FFFFFF',ink:'#1B2B31',soft:'#5F7378',line:'#D8D0C7',band:'#EEE9E3',strong:'#B4D7D8',danger:'#B5473A','primary-soft':'#EAEEEF','accent-soft':'#F3EFEB'},
  chart:['#285260','#548C92','#AB9072','#B4D7D8','#E0D7CF']},
 {id:'bank',name:'Banking',src:'Behance banking kit · green, purple, red, blue, yellow (adapted to light shell)',sw:['#0E1013','#1DBF8F','#6C3CF0','#2A5CF0','#F5C842'],
  t:{sidebar:'#0E1013','sidebar-fg':'#C9CDD3','sidebar-accent':'#17694F','sidebar-accent-fg':'#FFFFFF',primary:'#0E1013','primary-fg':'#FFFFFF',accent:'#1DBF8F',bg:'#F5F6F8',surface:'#FFFFFF',ink:'#0E1013',soft:'#5F6670',line:'#D7DAE0',band:'#ECEEF2',strong:'#B9BEC7',danger:'#F0505F','primary-soft':'#E7E7E7','accent-soft':'#DFF6EF'},
  chart:['#2A5CF0','#1DBF8F','#6C3CF0','#F5C842','#0E1013']},
 {id:'harbor',name:'Greek Harbor',src:'Greek Harbor pin · Aegean Deep, Harbor Grey, Terracotta Clay, Olive Grove, Sea Foam Mist',sw:['#2C3E50','#8C949E','#C06C4D','#919F5C','#BDD4C7'],
  t:{sidebar:'#2C3E50','sidebar-fg':'#D5DBE2','sidebar-accent':'#C06C4D','sidebar-accent-fg':'#FFFFFF',primary:'#2C3E50','primary-fg':'#FFFFFF',accent:'#C06C4D',bg:'#F6F8F6',surface:'#FFFFFF',ink:'#1F2A36',soft:'#6B7682',line:'#CDD3D8',band:'#EAF0EC',strong:'#BDD4C7',danger:'#B5473A','primary-soft':'#EAECEE','accent-soft':'#F6EAE6'},
  chart:['#2C3E50','#C06C4D','#919F5C','#8C949E','#BDD4C7']},
 {id:'dusk',name:'Dusk Blue',src:'Palettes that go with blue · Mystic Amethyst, Sage Drift, Sand & Shell, Dusk Blue, Weathered Pewter',sw:['#2C3539','#4C3C62','#607D8B','#8F9779','#E4DEC9'],
  t:{sidebar:'#2C3539','sidebar-fg':'#D3D8DA','sidebar-accent':'#4C3C62','sidebar-accent-fg':'#FFFFFF',primary:'#4C3C62','primary-fg':'#FFFFFF',accent:'#607D8B',bg:'#F8F6EF',surface:'#FFFFFF',ink:'#232A2E',soft:'#6A7378',line:'#D4D1C4',band:'#EFECE0',strong:'#B9B4A0',danger:'#9E3B3B','primary-soft':'#EDECEF','accent-soft':'#E9EDEF'},
  chart:['#4C3C62','#607D8B','#8F9779','#2C3539','#E4DEC9']},
 {id:'rosesage',name:'Rose & Sage',src:'Sage Green & Dusty Rose pin · 98A086 A76D5E C4A071 DFCCB1 846044',sw:['#846044','#A76D5E','#C4A071','#98A086','#DFCCB1'],
  t:{sidebar:'#846044','sidebar-fg':'#EEDFD0','sidebar-accent':'#A76D5E','sidebar-accent-fg':'#FFFFFF',primary:'#A76D5E',  'primary-fg':'#FFFFFF',accent:'#98A086',bg:'#F9F5EE',surface:'#FFFFFF',ink:'#3B2A20',soft:'#7E6A5A',line:'#DCCDB8',band:'#F2EADC',strong:'#C4A071',danger:'#A5473A','primary-soft':'#F6F0EF','accent-soft':'#F1F2EE'},
  chart:['#846044','#A76D5E','#98A086','#C4A071','#DFCCB1']},
 {id:'emerald',name:'Emerald & Gold',src:'Emerald & Antique Gold pin · F2EBDD 78947F 185844 102F27 B08A4F',sw:['#102F27','#185844','#78947F','#B08A4F','#F2EBDD'],
  t:{sidebar:'#102F27','sidebar-fg':'#CFDCD4','sidebar-accent':'#185844','sidebar-accent-fg':'#FFFFFF',primary:'#185844','primary-fg':'#FFFFFF',accent:'#B08A4F',bg:'#F8F4EA',surface:'#FFFFFF',ink:'#102F27',soft:'#5E6E66',line:'#D9D1C0',band:'#F2EBDD',strong:'#B08A4F',danger:'#9E3B3B','primary-soft':'#E8EEEC','accent-soft':'#F4EFE6'},
  chart:['#185844','#B08A4F','#78947F','#102F27','#D9CBAE']},
];

export const CLASSIC_ID = 'classic';
