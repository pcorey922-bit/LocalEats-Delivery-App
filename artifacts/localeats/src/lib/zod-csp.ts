import { z } from "zod";

// Disable Zod dynamic-code probes/JIT before loading application schemas.
// Keep strict CSP: no unsafe-eval allowance is needed.
z.config({ jitless: true });
