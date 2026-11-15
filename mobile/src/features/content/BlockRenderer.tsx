import { View } from 'react-native';

import { createStyles, Divider, Icon, PressableScale, Text } from '@/design';
import type { TypeVariant } from '@/design/tokens/typography';

import { attachmentIcon, attachmentLabel } from './attachment';
import { AutoImage } from './AutoImage';
import { BlockTable } from './BlockTable';
import { InlineText } from './InlineText';
import { openExternal } from './links';
import type { AttachmentBlock, Block } from './schema';

export interface BlockRendererProps {
  blocks: Block[];
  /**
   * What a tapped link does. A link to another announcement in the feed opens
   * in the app; anything else opens in an in-app browser. The screen decides,
   * since only it knows the feed.
   */
  onLinkPress: (href: string) => void;
}

/** Draws the block content model with the app's own native components. */
export function BlockRenderer({ blocks, onLinkPress }: BlockRendererProps) {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} onLinkPress={onLinkPress} />
      ))}
    </View>
  );
}

const headingVariant: Record<2 | 3 | 4, TypeVariant> = {
  2: 'heading',
  3: 'subheading',
  4: 'bodyStrong',
};

function BlockView({ block, onLinkPress }: { block: Block; onLinkPress: (href: string) => void }) {
  const styles = useStyles();

  switch (block.type) {
    case 'heading':
      return (
        <InlineText
          content={block.content}
          variant={headingVariant[block.level]}
          accessibilityRole="header"
          onLinkPress={onLinkPress}
        />
      );
    case 'paragraph':
      return <InlineText content={block.content} onLinkPress={onLinkPress} />;
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text variant="body" color="textMuted" style={styles.marker}>
                {block.ordered ? `${index + 1}.` : '•'}
              </Text>
              <InlineText content={item} onLinkPress={onLinkPress} style={styles.listText} />
            </View>
          ))}
        </View>
      );
    case 'quote':
      return (
        <View style={styles.quote}>
          <InlineText content={block.content} color="textMuted" onLinkPress={onLinkPress} />
        </View>
      );
    case 'image':
      return <AutoImage src={block.src} alt={block.alt} />;
    case 'table':
      return <BlockTable block={block} onLinkPress={onLinkPress} />;
    case 'divider':
      return <Divider />;
    case 'attachment':
      return <AttachmentCard block={block} />;
  }
}

function AttachmentCard({ block }: { block: AttachmentBlock }) {
  const styles = useStyles();
  const label = attachmentLabel(block.format);
  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={block.name}
      onPress={() => openExternal(block.href)}
      style={styles.attachment}
    >
      <View style={styles.attachmentIcon}>
        <Icon name={attachmentIcon(block.format)} color="onPrimaryMuted" />
      </View>
      <View style={styles.attachmentText}>
        <Text variant="subheading" numberOfLines={2}>
          {block.name}
        </Text>
        {label ? (
          <Text variant="caption" color="textMuted">
            {label}
          </Text>
        ) : null}
      </View>
      <Icon name="externalLink" size={18} color="textSubtle" />
    </PressableScale>
  );
}

const useStyles = createStyles((theme) => ({
  container: {
    gap: theme.spacing[4],
  },
  list: {
    gap: theme.spacing[2],
  },
  listItem: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  marker: {
    minWidth: 20,
  },
  listText: {
    flex: 1,
  },
  quote: {
    paddingLeft: theme.spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primaryMuted,
  },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentText: {
    flex: 1,
    gap: theme.spacing[0.5],
  },
}));
