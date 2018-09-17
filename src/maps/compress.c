#include<stdio.h>

void ConvertMap(FILE *file, int n)
{
    char s[100];
    int i;
    for(i=0; i<17; i++)
    {
        fscanf(file, "%s", s);
        fprintf(stderr, "%2i %s\n", i, s);

        unsigned char x = 0;
        int bit = 7;
        for(int j=0; j<32; j++)
        {
            if (s[j] == '*') x |= 1<<bit;
            bit--;
            if (bit < 0)
            {
                bit = 7;
                printf("0x%02X", x);
                x = 0;
                if (j != 31 || i != 16 || n != 7) printf(", ");
            }
        }
        printf("\n");
    }
    fscanf(file, "%s", s);
    fprintf(stderr, "%2i %s \n", i, s);
}

void ConvertMaps(char *filename, char *name, int n)
{
    FILE *file = fopen(filename, "r");
    if (file == NULL)
    {
	    fprintf(stderr, "Error: Cannot open file\n");
	    return;
    }
    printf("char maps[%i] = {\n", 32*17*n/8);
    for(int i=0; i<n; i++)
    {
        ConvertMap(file, i);
    }

    printf("};\n");

    fclose(file);
}

int main()
{
  ConvertMaps("src/maps/maps.txt", "maps", 8);
  return 0;
}
