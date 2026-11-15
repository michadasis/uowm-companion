import { Fragment } from 'react';
import type { AccessibilityRole, StyleProp, TextStyle } from 'react-native';

import { Text } from '@/design';
import type { TextColor, TextProps } from '@/design';
import { fontFamily } from '@/design/tokens/typography';

import type { Inline } from './schema';

export interface InlineTextProps {
  content: Inline;
  variant?: TextProps['variant'];
  color?: TextColor;
  /** Called when a link run is tapped, with its absolute URL. */
  onLinkPress: (href: string) => void;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * Renders inline content: a run of plain text, a bold or italic run, and
 * links, as nested Text so it wraps as one paragraph. Bold is a heavier font
 * rather than a synthesized weight, since each weight is its own file.
 */
export function InlineText({
  content,
  variant = 'body',
  color = 'text',
  onLinkPress,
  accessibilityRole,
  style,
  numberOfLines,
}: InlineTextProps) {
  return (
    <Text
      variant={variant}
      color={color}
      accessibilityRole={accessibilityRole}
      style={style}
      numberOfLines={numberOfLines}
    >
      {content.map((run, index) => {
        const runStyle: TextStyle = {
          ...(run.bold ? { fontFamily: fontFamily.semibold } : null),
          ...(run.italic ? { fontStyle: 'italic' } : null),
        };

        if (run.href) {
          const href = run.href;
          return (
            <Text
              key={index}
              variant={variant}
              color="primary"
              onPress={() => onLinkPress(href)}
              style={[runStyle, styles.link]}
            >
              {run.text}
            </Text>
          );
        }
        return (
          <Fragment key={index}>
            {run.bold || run.italic ? (
              <Text variant={variant} color={color} style={runStyle}>
                {run.text}
              </Text>
            ) : (
              run.text
            )}
          </Fragment>
        );
      })}
    </Text>
  );
}

const styles = { link: { textDecorationLine: 'underline' as const } };
