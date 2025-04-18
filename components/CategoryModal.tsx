import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
  } from "react-native";
  import { useState } from "react";
  
  const CategoryModal = ({
    visible,
    onClose,
    onConfirm,
  }: {
    visible: boolean;
    onClose: () => void;
    onConfirm: (category: string) => void;
  }) => {
    const [category, setCategory] = useState("");
  
    const handleConfirm = () => {
      const trimmed = category.trim();
      onConfirm(trimmed || "Favoriler"); // boşsa varsayılan
      setCategory("");
      onClose();
    };
  
    return (
      <Modal visible={visible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-center items-center bg-black/60 px-6"
        >
          <View className="bg-dark-100 w-full rounded-xl p-6 gap-4">
            <Text className="text-white text-lg font-semibold">
              Add to Category
            </Text>
            <TextInput
              value={category}
              onChangeText={setCategory}
              placeholder="Enter category title (optional)"
              placeholderTextColor="#888"
              className="bg-dark-200 rounded-lg px-4 py-3 text-white"
            />
  
            <View className="flex-row justify-end gap-3 mt-2">
              <TouchableOpacity onPress={onClose}>
                <Text className="text-gray-400 font-medium">Cancel</Text>
              </TouchableOpacity>
  
              <TouchableOpacity onPress={handleConfirm}>
                <Text className="text-accent font-bold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };
  
  export default CategoryModal;
  