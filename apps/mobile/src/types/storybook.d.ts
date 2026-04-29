declare module '@storybook/react' {
  import type { ComponentType, ReactNode } from 'react';

  export type Meta<T = unknown> = {
    title?: string;
    component?: ComponentType<T> | ((props: T) => ReactNode);
    parameters?: Record<string, unknown>;
    argTypes?: Record<string, unknown>;
    args?: Record<string, unknown>;
  };

  export type Story<T = unknown> = {
    args?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    decorators?: Array<(Story: ComponentType) => ReactNode>;
    render?: (args: T) => ReactNode;
  };

  export type StoryObj<T = unknown> = {
    args?: Record<string, unknown>;
    parameters?: Record<string, unknown>;
    decorators?: Array<(Story: ComponentType) => ReactNode>;
    render?: (args: T) => ReactNode;
  };
}
