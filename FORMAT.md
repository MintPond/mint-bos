# BOS - Data Format #

The BOS data format is kept simple. All serialized data begins with
4-bytes that specify the total size of the data. The size is used to
verify that all data is present. Following this the `DataType` followed
by type specific data.

### Format Overview ###
| Field     | Size (bytes)  | Description |
|-----------|:-------------:|-------------|
| DataSize  | 4 | The total size of the data including the DataSize bytes |
| RootValue | * | Depending on the DataType, the root value may have child values. Data size is dependant on the DataType of the value. |

## Data Types ##
The data type specifies what type of data is serialized and is always the first byte of a serialized value.
The fields used to serialize a value differ for each data type.

| Type   | Value | Notes |
|--------|:-----:|-------|
| NULL   | 0x00  | No data - deserializes as `null` |
| BOOL   | 0x01  |  |
| INT8   | 0x02  | Signed byte |
| INT16  | 0x03  | Signed 16-bit integer |
| INT32  | 0x04  | Signed 32-but integer |
| INT64  | 0x05  | Not implemented. Included for future use. |
| UINT8  | 0x06  | Unsigned byte |
| UINT16 | 0x07  | Unsigned 16-bit integer |
| UINT32 | 0x08  | Unsigned 32-bit integer |
| UINT64 | 0x09  | Not implemented. Included for future use. |
| FLOAT  | 0x0A  | 32-bit floating point number. |
| DOUBLE | 0x0B  | Not implemented. Included for future use. |
| STRING | 0x0C  | String of characters. |
| BYTES  | 0x0D  | Binary data. |
| ARRAY  | 0x0E  | Array of Values. |
| OBJ    | 0x0F  | JSON-like object with named key values. |

## Values ##

### NULL ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [NULL](#data-types) |

### BOOL ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [BOOL](#data-types) |
| Value    | 1            | Value is 0x01 if `true`, 0x00 if `false` |

### INT8 ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [INT8](#data-types) |
| Value    | 1            | The 8-bit integer value |

### INT16 ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [INT16](#data-types) |
| Value    | 2            | The 16-bit integer value |

### INT32 ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [INT32](#data-types) |
| Value    | 4            | The 32-bit integer value |


### UINT8 ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [UINT8](#data-types) |
| Value    | 1            | The unsigned 8-bit integer value |

### UINT16 ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [UINT16](#data-types) |
| Value    | 2            | The unsigned 16-bit integer value |

### UINT32 ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [INT32](#data-types) |
| Value    | 4            | The unsigned 32-bit integer value |


### FLOAT ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [FLOAT](#data-types) |
| Value    | 4            | The 32-bit floating point value |

### STRING ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [STRING](#data-types) |
| Length   | Variable     | The [UVarInt](#uvarint) specifying the number of bytes in the string |
| Value    | *            | The string value. The size is the number of bytes specified in _Length_ field |

### BYTES ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [BYTES](#data-types) |
| Length   | Variable     | The [UVarInt](#uvarint) specifying the number of bytes |
| Value    | *            | The bytes. The number of bytes is specified in _Length_ field |

### ARRAY ###
| Field    | Size (bytes) | Description |
|----------|:------------:|-------------|
| DataType | 1            | Data type that specifies [ARRAY](#data-types) |
| Count    | Variable     | The [UVarInt](#uvarint) specifying how many Values are in the _Values_ field. |
| Values   | *            | The serialized Values that are in the array. |

### OBJ ###
| Field     | Size (bytes) | Description |
|-----------|:------------:|-------------|
| DataType  | 1            | Data type that specifies [OBJ](#data-types) |
| KeyCount  | Variable     | The [UVarInt](#uvarint) specifying how many key/values in the _KeyValues_ field. |
| KeyValues | *            | The key/value pairs of the object. See _KeyValue_. |

#### KeyValue ####
| Field         | Size (bytes) | Description |
|---------------|:------------:|-------------|
| KeyNameLength | Variable     | The [UVarInt](#uvarint) integer specifying the number of bytes used for the key name. |
| KeyName       | *            | The UTF8 encoded key name string. The number of bytes is specified with _KeyNameLength_ |
| Value         | *            | The serialized Value. Fields and size of Value depend on the Value's DataType. |

### UVarInt ###
This is not an available Value type but is used within Value fields to
specify lengths and counts. It is based on the [Variable Length Integer used in Bitcoin](https://en.bitcoin.it/wiki/Protocol_specification#Variable_length_integer).

| Number         | Size (bytes) | Format |
|----------------|:------------:|-------------|
| <  0xFD        | 1            | 8-bit unsigned integer  |
| <= 0xFFFF      | 3            | 0xFD followed by the number as 16-bit unsigned integer |
| <= 0xFFFF FFFF | 5            | 0xFE followed by the number as 32-bit unsigned integer |
| -              | 9            | Not Implemented. 0xFF followed by the number as 64-bit unsigned integer |