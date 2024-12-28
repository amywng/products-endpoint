#!/bin/bash

REG_TOKEN=c71f1bbd-dd12-427c-bcc5-5ac62845f3e4
API_BASE_URL=https://prods.garrettladley.com/api/v1
REG_URL=${API_BASE_URL}/${REG_TOKEN}/prompt
PRODUCTS_URL=${API_BASE_URL}/products

PRODUCT_IDS=$(curl -s ${REG_URL} | jq -r '.product_ids[]')
# echo $PRODUCT_IDS

for id in ${PRODUCT_IDS}
do
    curl -s ${PRODUCTS_URL}/$id
done | jq -s > data.json