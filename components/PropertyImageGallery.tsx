import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  Dimensions, 
  Pressable,
  Text
} from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { prefetchPropertyImageUrls } from '@/utils/property-images';

type PropertyImageGalleryProps = {
  images: string[];
  previewImages?: string[];
};

const { width } = Dimensions.get('window');

export default function PropertyImageGallery({ images, previewImages }: PropertyImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Use previewImages as fallback when no remote images available yet
  const displayImages = images.length > 0 ? images : (previewImages || []);
  const isShowingPreviews = images.length === 0 && (previewImages?.length ?? 0) > 0;

  React.useEffect(() => {
    void prefetchPropertyImageUrls(images);
  }, [images]);

  const handlePrevious = () => {
    if (activeIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex - 1,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (activeIndex < images.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / width);
    setActiveIndex(newIndex);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={displayImages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item }}
              // When showing remote images, use previewImages as placeholder while loading
              placeholder={!isShowingPreviews && previewImages?.[index] ? { uri: previewImages[index] } : undefined}
              style={styles.image}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={120}
            />
          </View>
        )}
      />

      {/* Navigation buttons */}
      {displayImages.length > 1 && (
        <>
          {activeIndex > 0 && (
            <Pressable style={[styles.navButton, styles.leftButton]} onPress={handlePrevious}>
              <ChevronLeft size={24} color="white" />
            </Pressable>
          )}
          
          {activeIndex < displayImages.length - 1 && (
            <Pressable style={[styles.navButton, styles.rightButton]} onPress={handleNext}>
              <ChevronRight size={24} color="white" />
            </Pressable>
          )}
          
          {/* Image counter */}
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {activeIndex + 1} / {displayImages.length}
            </Text>
          </View>
          
          {/* Dots indicator */}
          <View style={styles.dotsContainer}>
            {displayImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeIndex && styles.activeDot
                ]}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 300,
  },
  imageContainer: {
    width,
    height: 300,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftButton: {
    left: 16,
  },
  rightButton: {
    right: 16,
  },
  counter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  counterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: 'white',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});