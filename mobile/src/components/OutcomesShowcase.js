import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export const OUTCOMES_DATA = [
  {
    id: 1,
    icon: '🐄',
    title: 'Instant Sick Animal Reports',
    summary: 'Get news about a sick animal to a doctor instantly, instead of waiting weeks.',
    example:
      'Imagine a cow gets sick in a small village. Normally, a paper form travels by hand from officer to officer, taking weeks. With this system, the farmer makes a free phone call or sends a text, and the central animal doctor knows about it in 5 seconds.',
    tag: '5-Second Telemetry',
  },
  {
    id: 2,
    icon: '🔍',
    title: 'Early Disease Detection',
    summary: 'Catching a contagious disease when only 3 animals have it, before it spreads to 3,000.',
    example:
      'If 4 different farmers in neighboring villages report pigs with a high fever on the same morning, the computer connects the dots and says, "Warning: This looks like the start of a dangerous swine virus!" before it spreads everywhere.',
    tag: 'Community Outbreak Guard',
  },
  {
    id: 3,
    icon: '💉',
    title: 'Vaccination Alerts & Reminders',
    summary: 'Making sure no animal misses its health shots.',
    example:
      'The app keeps a record for every cow. When it\'s time for a foot-and-mouth vaccine, the system automatically sends a text to the farmer saying, "Bring your cows to the village center on Tuesday for their shots."',
    tag: 'Village Herd Calendar',
  },
  {
    id: 4,
    icon: '💊',
    title: 'Fast Medicine & Diagnostics',
    summary: 'Getting medicine to the animal quickly and stopping the disease from leaving the farm.',
    example:
      'A vet takes a blood sample from a sick goat, scans a barcode on the bottle, and sends it to the lab. The lab tests it, texts the diagnosis back the same day, and the vet starts the right medicine immediately while telling the farmer to isolate that goat.',
    tag: 'Same-Day Treatment',
  },
  {
    id: 5,
    icon: '🥛',
    title: 'Protect Livestock & Milk Yield',
    summary: 'Fewer animals die, and animals stay healthy enough to keep producing milk, eggs, or meat.',
    example:
      'If a dairy cow gets an udder infection and is treated on Day 1, she gets better quickly and keeps producing milk. If the farmer had to wait two weeks for help, the cow might die or stop producing milk forever, costing the farmer their income.',
    tag: 'Dairy Income Guard',
  },
  {
    id: 6,
    icon: '🗺️',
    title: 'Seasonal Planning & Supplies',
    summary: 'Using real maps and facts to prepare ahead of time instead of guessing.',
    example:
      'Government leaders look at a map on their computer screen and see: "Every year after the heavy rains, mosquitoes cause a disease spike in Region A." So, they ship medicine and vaccines to Region A before the rains start.',
    tag: 'Monsoon Preparedness',
  },
];

export const OutcomesShowcase = () => {
  const [expandedId, setExpandedId] = useState(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.badge}>FARMER BENEFITS & VALUE</Text>
        <Text style={styles.headerTitle}>How This System Protects Your Herd</Text>
        <Text style={styles.headerSubtitle}>
          Simple tools that connect your village to animal doctors instantly, stop epidemics before they start, and protect your family's income.
        </Text>
      </View>

      <View style={styles.cardsList}>
        {OUTCOMES_DATA.map((item) => {
          const isExpanded = expandedId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
              style={[styles.card, isExpanded && styles.cardActive]}
            >
              {/* Card Header Row */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.tagRow}>
                    <Text style={styles.outcomeNumber}>BENEFIT #{item.id}</Text>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{item.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {/* Summary */}
              <Text style={styles.summaryText}>{item.summary}</Text>

              {/* Real World Practical Village Example */}
              {isExpanded && (
                <View style={styles.exampleBox}>
                  <Text style={styles.exampleLabel}>💡 Practical Village Example:</Text>
                  <Text style={styles.exampleText}>{item.example}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBE7',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C8E6C9',
    shadowColor: '#1B5E20',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  badge: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E65100',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1B5E20',
    lineHeight: 26,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#424242',
    marginTop: 6,
    lineHeight: 19,
  },
  cardsList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#FCFDF7',
    borderWidth: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  iconText: {
    fontSize: 22,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  outcomeNumber: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E65100',
    letterSpacing: 0.8,
  },
  tagBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#212121',
  },
  chevron: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 6,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '500',
  },
  exampleBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFDE7',
    borderLeftWidth: 4,
    borderLeftColor: '#E65100',
    borderWidth: 1,
    borderColor: '#FFF9C4',
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E65100',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    color: '#424242',
    lineHeight: 19,
  },
});
