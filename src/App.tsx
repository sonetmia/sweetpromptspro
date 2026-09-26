/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import AppShell from './components/layout/AppShell';
import { ThemeProvider } from './lib/theme/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
