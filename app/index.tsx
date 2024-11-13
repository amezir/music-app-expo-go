import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import { Audio } from 'expo-av';

const BASE_URL = 'https://api.deezer.com/';

export default function Music() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const searchTracks = async (query) => {
    try {
      if (!query) {
        setTracks([]);
        return;
      }
      const response = await axios.get(`${BASE_URL}search?q=${query}`);
      setTracks(response.data.data);
      setSelectedTrack(null);
    } catch (error) {
      console.error(error);
    }
  };

  const showTrackDetails = async (trackId) => {
    try {
      const response = await axios.get(`${BASE_URL}track/${trackId}`);
      setSelectedTrack(response.data);
      stopAndUnloadSound();
    } catch (error) {
      console.error(error);
    }
  };

  const stopAndUnloadSound = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    }
  };

  const playPauseTrack = async () => {
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      if (sound) {
        await sound.playAsync();
      } else {
        setIsLoading(true);
        const { sound: playbackObject } = await Audio.Sound.createAsync(
          { uri: selectedTrack.preview },
          { shouldPlay: true }
        );
        setSound(playbackObject);
        playbackObject.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis);
            if (!status.isPlaying) {
              setIsPlaying(false);
            }
          }
        });
        setIsLoading(false);
      }
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchTracks(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
      <Image
        source={
          selectedTrack
            ? { uri: selectedTrack.album.cover_big }
            : require('@/assets/images/texture1.jpg')
        }
        style={styles.reactLogo}
      />
      <FlatList
        ListHeaderComponent={
          <TextInput
            style={styles.input}
            placeholder="Rechercher un morceau"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        }
        data={selectedTrack ? [selectedTrack] : tracks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) =>
          selectedTrack ? (
            <View style={styles.details}>
              <Text style={styles.trackTitle}>TITRE : {item.title}</Text>
              <Image source={{ uri: item.artist.picture_big }} style={styles.artist} />
              <Text style={styles.txt}>Artiste : {item.artist.name}</Text>
              <Text style={styles.txt}>Album : {item.album.title}</Text>
              <Text style={styles.txt}>Durée : {item.duration} secondes</Text>
              <Slider
                style={styles.slider}
                value={position}
                minimumValue={0}
                maximumValue={duration}
                onValueChange={async (value) => {
                  if (sound) {
                    await sound.setPositionAsync(value);
                  }
                }}
              />
              <TouchableOpacity onPress={playPauseTrack} style={styles.playPauseButton}>
                <Text style={styles.playPauseText}>
                  {isPlaying ? 'Pause' : isLoading ? 'Chargement...' : 'Play'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedTrack(null)}>
                <Text style={styles.backButton}>Retour aux résultats</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => showTrackDetails(item.id)}>
              <Text style={styles.trackItem}>
                {item.title} - {item.artist.name}
              </Text>
            </TouchableOpacity>
          )
        }
        contentContainerStyle={styles.container}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    width: '100%',
    height: '45%',
    resizeMode: 'cover',
  },
  container: {
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  trackItem: {
    padding: 10,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  details: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#000000',
    borderRadius: 5,
    color: '#fff',
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  txt: {
    color: '#fff',
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 20,
  },
  playPauseButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    alignItems: 'center',
  },
  playPauseText: {
    color: '#000',
    fontWeight: 'bold',
  },
  backButton: {
    display: 'flex',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  artist: {
    display: 'flex',
    justifyContent: 'center',
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
});