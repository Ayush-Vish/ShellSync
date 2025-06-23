// export interface Terminal {
//   id: string;
//   terminalId?: string; // Backend terminal ID
//   status: 'creating' | 'ready' | 'error';
//   createdAt: Date;
//   error?: string;
//   position: { x: number; y: number };
// }

// export class TerminalManager {
//   private terminals: Map<string, Terminal> = new Map();
//   private terminalIdMapping: Map<string, string> = new Map(); // frontend ID -> backend terminal ID
  
//   constructor() {}

//   // Create a new terminal entry
//   createTerminal(position: { x: number; y: number }): Terminal {
//     const terminal: Terminal = {
//       id: `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       status: 'creating',
//       createdAt: new Date(),
//       position,
//     };
    
//     this.terminals.set(terminal.id, terminal);
//     return terminal;
//   }

//   // Update terminal when backend confirms creation
//   confirmTerminalCreation(frontendId: string, backendTerminalId: string): boolean {
//     const terminal = this.terminals.get(frontendId);
//     if (terminal && terminal.status === 'creating') {
//       terminal.terminalId = backendTerminalId;
//       terminal.status = 'ready';
//       this.terminalIdMapping.set(frontendId, backendTerminalId);
//       this.terminals.set(frontendId, terminal);
//       return true;
//     }
//     return false;
//   }

//   // Handle terminal creation error
//   setTerminalError(frontendId: string, error: string): boolean {
//     const terminal = this.terminals.get(frontendId);
//     if (terminal) {
//       terminal.status = 'error';
//       terminal.error = error;
//       this.terminals.set(frontendId, terminal);
//       return true;
//     }
//     return false;
//   }

//   // Get terminal by frontend ID
//   getTerminal(frontendId: string): Terminal | undefined {
//     return this.terminals.get(frontendId);
//   }

//   // Get backend terminal ID by frontend ID
//   getBackendTerminalId(frontendId: string): string | undefined {
//     return this.terminalIdMapping.get(frontendId);
//   }

//   // Get frontend ID by backend terminal ID
//   getFrontendId(backendTerminalId: string): string | undefined {
//     for (const [frontendId, backendId] of this.terminalIdMapping.entries()) {
//       if (backendId === backendTerminalId) {
//         return frontendId;
//       }
//     }
//     return undefined;
//   }

//   // Remove terminal
//   removeTerminal(frontendId: string): boolean {
//     const terminal = this.terminals.get(frontendId);
//     if (terminal) {
//       this.terminals.delete(frontendId);
//       if (terminal.terminalId) {
//         this.terminalIdMapping.delete(frontendId);
//       }
//       return true;
//     }
//     return false;
//   }

//   // Update terminal position
//   updatePosition(frontendId: string, position: { x: number; y: number }): boolean {
//     const terminal = this.terminals.get(frontendId);
//     if (terminal) {
//       terminal.position = position;
//       this.terminals.set(frontendId, terminal);
//       return true;
//     }
//     return false;
//   }

//   // Get all terminals
//   getAllTerminals(): Terminal[] {
//     return Array.from(this.terminals.values());
//   }

//   // Get ready terminals only
//   getReadyTerminals(): Terminal[] {
//     return this.getAllTerminals().filter(t => t.status === 'ready');
//   }

//   // Get creating terminals
//   getCreatingTerminals(): Terminal[] {
//     return this.getAllTerminals().filter(t => t.status === 'creating');
//   }

//   // Get error terminals
//   getErrorTerminals(): Terminal[] {
//     return this.getAllTerminals().filter(t => t.status === 'error');
//   }

//   // Check if any terminals are being created
//   hasCreatingTerminals(): boolean {
//     return this.getCreatingTerminals().length > 0;
//   }

//   // Clear all terminals
//   clear(): void {
//     this.terminals.clear();
//     this.terminalIdMapping.clear();
//   }
//       // Get terminal count
//       getTerminalCount(): number {
//         return this.terminals.size;
//       }     
//       // Get terminal count by status
//       getTerminalCountByStatus(status: 'creating' | 'ready' | 'error'): number {
//         return this.getAllTerminals().filter(t => t.status === status).length;
//       }
//       // Get terminal positions
//       getTerminalPositions(): { [id: string]: { x: number; y: number } } {
//         const positions: { [id: string]: { x: number; y: number } } = {};
//         this.terminals.forEach((terminal, id) => {
//           positions[id] = terminal.position;
//         });
//         return positions;
//       }
// }
