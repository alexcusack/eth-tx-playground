### Deploying a smart contarct wallet: 

```bash
REACT_APP_BASESCAN_API_KEY=basescan_api_key_value npm start
```

##### Generate a local key for signing passkey based transactions 

Step 1: Generate a P-256 private key
```
openssl ecparam -name prime256v1 -genkey -noout -out private_key.pem`
public_key_130=$(openssl ec -in private_key.pem -pubout -outform DER | tail -c 65 | xxd -p -c 130)
public_key_64=${public_key_130:2}

echo "Private Key (PEM format):"
cat private_key.pem
echo
echo "64-byte Public Key (hex):"
echo $public_key_64
```
