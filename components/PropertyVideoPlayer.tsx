import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

type PropertyVideoPlayerProps = {
  source: string;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'contain' | 'cover';
  allowsFullscreen?: boolean;
  nativeControls?: boolean;
};

export default function PropertyVideoPlayer({
  source,
  style,
  contentFit = 'cover',
  allowsFullscreen = true,
  nativeControls = true,
}: PropertyVideoPlayerProps) {
  const player = useVideoPlayer({ uri: source }, (instance) => {
    instance.loop = false;
  });

  return (
    <View style={[styles.container, style]} onStartShouldSetResponder={() => true}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        nativeControls={nativeControls}
        allowsFullscreen={allowsFullscreen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});