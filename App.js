import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, Button, Text, Image, FlatList, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [cars, setCars] = useState([]);
  const [filteredCars, setFilteredCars] = useState([]); // For filtered results
  const [carName, setCarName] = useState('');
  const [carKey, setCarKey] = useState(''); // Optional field
  const [carYear, setCarYear] = useState(''); // This field is now optional
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCarId, setEditingCarId] = useState(null); // Track the car being edited

  useEffect(() => {
    loadCars(); // Load cars on app start
  }, []);

  const saveCars = useCallback(async () => {
    try {
      const jsonValue = JSON.stringify(cars);
      await AsyncStorage.setItem('@car_collection', jsonValue);
    } catch (e) {
      console.error('Failed to save cars', e);
    }
  }, [cars]); // Only re-create the function when 'cars' changes

  useEffect(() => {
    saveCars(); // Save cars every time they change
  }, [cars, saveCars]);

  const loadCars = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('@car_collection');
      if (jsonValue != null) {
        const savedCars = JSON.parse(jsonValue);
        setCars(savedCars);
        setFilteredCars(savedCars); // Show all cars initially
      }
    } catch (e) {
      console.error('Failed to load cars', e);
    }
  };

  const addOrUpdateCar = () => {
    if (carName && selectedImage) { // Only require carName and selectedImage
      const newCar = {
        id: Math.random().toString(),
        name: carName,
        key: carKey || '', // Optional field
        year: carYear || '', // Optional field
        image: selectedImage,
      };

      if (editingCarId) {
        // Update existing car
        const updatedCars = cars.map(car => car.id === editingCarId ? { ...newCar, id: editingCarId } : car);
        setCars(updatedCars);
      } else {
        // Add new car
        setCars([...cars, newCar]);
      }

      setFilteredCars(cars); // Keep filtered cars updated
      resetForm(); // Reset form fields after adding or updating a car
    } else {
      Alert.alert('Error', 'Please fill in the car name and add an image');
    }
  };

  const resetForm = () => {
    setCarName('');
    setCarKey(''); // Reset carKey
    setCarYear(''); // Reset carYear
    setSelectedImage(null);
    setSearchQuery(''); // Optional: Reset search query as well
    setEditingCarId(null); // Reset editing state
  };

  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!pickerResult.cancelled) {
      setSelectedImage(pickerResult.assets[0].uri); 
    }
  };

  const takePhoto = async () => {
    let permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access camera is required!');
      return;
    }

    let cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!cameraResult.cancelled) {
      setSelectedImage(cameraResult.assets[0].uri); 
    }
  };

  const retakePhoto = () => {
    setSelectedImage(null); // Clear current image
    takePhoto(); // Open the camera to retake the photo
  };

  const deleteCar = (id) => {
    Alert.alert(
      'Delete Confirmation',
      'Are you sure you want to delete this car?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          const updatedCars = cars.filter((car) => car.id !== id);
          setCars(updatedCars);
          setFilteredCars(updatedCars); // Update the filtered list as well
        }}
      ]
    );
  };

  const editCar = (car) => {
    setCarName(car.name);
    setCarKey(car.key);
    setCarYear(car.year);
    setSelectedImage(car.image);
    setEditingCarId(car.id); // Set the editing car ID
  };

  const filterCars = (text) => {
    setSearchQuery(text);

    if (text === '') {
      setFilteredCars(cars); // Show all cars when the search query is empty
    } else {
      const filteredList = cars.filter((car) =>
        car.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCars(filteredList);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredCars(cars); // Reset to show all cars
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Search bar */}
      <Text style={styles.searchLabel}>Search Cars</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search car name..."
          value={searchQuery}
          onChangeText={filterCars}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearText}>X</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.label}>Car Name</Text>
      <TextInput
        placeholder="Enter car name"
        value={carName}
        onChangeText={setCarName}
        style={styles.input}
      />

      <Text style={styles.label}>Car Key (optional)</Text>
      <TextInput
        placeholder="Enter car key (optional)"
        value={carKey}
        onChangeText={setCarKey}
        style={styles.input}
      />

      <Text style={styles.label}>Car Year (optional)</Text>
      <TextInput
        placeholder="Enter car year (optional)"
        value={carYear}
        onChangeText={setCarYear}
        keyboardType="numeric"
        style={styles.input}
      />

      {selectedImage ? (
        <View>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <Button title="Retake Photo" onPress={retakePhoto} />
        </View>
      ) : (
        <View style={styles.buttonContainer}>
          <Button title="Pick from Gallery" onPress={pickImage} />
          <Button title="Take a Photo" onPress={takePhoto} />
        </View>
      )}

      <View style={styles.actionButtons}>
        <Button title={editingCarId ? "Update Car" : "Add Car"} onPress={addOrUpdateCar} />
        <Button title="Cancel Adding" onPress={resetForm} color="red" />
      </View>

      <Text style={styles.heading}>My Hot Wheels Collection</Text>
      <FlatList
        data={filteredCars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.carItem}>
            <Text style={styles.carName}>{item.name}</Text>
            {item.key ? <Text style={styles.carKey}>Key: {item.key}</Text> : null}
            {item.year ? <Text>Year: {item.year}</Text> : null}
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.image} />
            )}
            <View style={styles.carActions}>
              <TouchableOpacity onPress={() => editCar(item)} style={[styles.actionButton, styles.editButton]}>
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCar(item.id)} style={[styles.actionButton, styles.deleteButton]}>
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  searchLabel: { 
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    fontSize: 16,
  },
  clearButton: {
    marginLeft: 10,
    backgroundColor: '#ff4444',
    padding: 8,
    borderRadius: 5,
  },
  clearText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
    height: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  imagePreview: {
    width: 150,
    height: 150,
    marginTop: 10,
    alignSelf: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  image: {
    width: 150,
    height: 150,
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  heading: {
    marginTop: 20,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  carItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginVertical: 5,
    borderRadius: 5,
    flexDirection: 'column', // Use column for vertical layout
  },
  carName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1, // Allow car name to take remaining space
  },
  carKey: {
    fontSize: 14,
    color: 'gray',
  },
  carActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
  actionButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5, // Space between buttons
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#007BFF', // Blue color for edit button
  },
  deleteButton: {
    backgroundColor: '#FF4444', // Red color for delete button
  },
});

