#!/bin/bash

# Usage: ./update-chunks.sh <csv-file> <start-index> <end-index> <chunk-size>
# Example: ./update-chunks.sh attached_assets/customers-2025-03-13.csv 300 2129 100

CSV_FILE=$1
START_INDEX=$2
END_INDEX=$3
CHUNK_SIZE=$4

if [ -z "$CSV_FILE" ] || [ -z "$START_INDEX" ] || [ -z "$END_INDEX" ] || [ -z "$CHUNK_SIZE" ]; then
  echo "Usage: ./update-chunks.sh <csv-file> <start-index> <end-index> <chunk-size>"
  exit 1
fi

echo "Starting batch update process from index $START_INDEX to $END_INDEX in chunks of $CHUNK_SIZE"

for ((i = START_INDEX; i < END_INDEX; i += CHUNK_SIZE)); do
  end=$((i + CHUNK_SIZE))
  if [ $end -gt $END_INDEX ]; then
    end=$END_INDEX
  fi
  
  echo "Processing chunk $i to $end..."
  node process-remaining-customers.js $CSV_FILE $i $end
  
  echo "Chunk $i to $end completed."
  echo "-------------------------------------------------"
  
  # Small pause to let the system catch up
  sleep 2
done

echo "All chunks processed. Update complete!"