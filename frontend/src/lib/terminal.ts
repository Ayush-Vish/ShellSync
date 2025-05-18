import { Terminal } from "@xterm/xterm";
import { AttachAddon } from "xterm-addon-attach";
import { FitAddon } from "xterm-addon-fit";
import { ImageAddon } from "xterm-addon-image";
export interface IWindowWithTerminal extends Window {
      term: typeof Terminal;
      Terminal: typeof Terminal;
      AttachAddon?: typeof AttachAddon;  
      // ClipboardAddon?: typeof ClipboardAddon;  
      FitAddon?: typeof FitAddon;  
      ImageAddon?: typeof ImageAddon;  
      // ProgressAddon?: typeof ProgressAddon;  
      // SearchAddon?: typeof SearchAddon;  
      // SerializeAddon?: typeof SerializeAddon;  
      // WebLinksAddon?: typeof WebLinksAddon;  
      // WebglAddon?: typeof WebglAddon;  
      // Unicode11Addon?: typeof Unicode11Addon;  
      // UnicodeGraphemesAddon?: typeof UnicodeGraphemesAddon;  
      // LigaturesAddon?: typeof LigaturesAddon;  
    }
declare let window: IWindowWithTerminal;
