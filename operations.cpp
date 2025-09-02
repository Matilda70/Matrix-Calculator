//
// Created by kmatu on 19.08.2025.
//


#include "matrix.h"


void print_matrix(Matrix &A) {
    for (int i = 0; i < A.size(); i++) {
        for (int j = 0; j < A[0].size(); j++) {
            std::cout << A[i][j] << " ";
        }
        std::cout << std::endl;
    }
}

bool is_valid(Matrix &A, Matrix &B) {
    if (A.size() != B.size() || A[0].size() != B[0].size()) {
        std::cerr << "Матрицы должны быть одинакового размера" << std::endl;
        return false;
    }
    return true;
}

int rank_matrix(Matrix &A) {
    if (A.empty()) return 0;
    int n = (int) A.size();
    int m = (int) A[0].size();
    const long double EPS = 1e-12L;

    int rank = 0;
    int row = 0;
    for (int col = 0; col < m && row < n; ++col) {

        int sel = row;
        for (int i = row; i < n; ++i)
            if (fabsl(A[i][col]) > fabsl(A[sel][col])) sel = i;

        if (fabsl(A[sel][col]) < EPS) continue;

        if (sel != row) swap(A[sel], A[row]);
        for (int i = row + 1; i < n; ++i) {
            if (fabsl(A[i][col]) < EPS) continue;
            long double factor = A[i][col] / A[row][col];
            for (int j = col; j < m; ++j) A[i][j] -= factor * A[row][j];
        }
        ++row;
        ++rank;
    }
    return rank;
}

Matrix get_info(Matrix &A) {

    std::cout << "Rows: " << A.size() << std::endl;
    std::cout << "Columns: " << A[0].size() << std::endl;
    for (int i = 0; i < A.size(); i++) {
        for (int j = 0; j < A[0].size(); j++) {
            std::cout << "Enter element [" << i << "][" << j << "]: ";
            std::cin >> A[i][j];
        }
    }
    return A;
}

Matrix add(Matrix &A, Matrix &B) {

    Matrix C(A.size(), std::vector<long double>(A[0].size(), 0.0));

    if (is_valid(A, B) == 0) return C;

    for (int i = 0; i < A.size(); i++) {
        for (int j = 0; j < A[0].size(); j++) {
            C[i][j] = A[i][j] + B[i][j];
        }
    }
    return C;
}

Matrix sub(Matrix &A, Matrix &B) {

    Matrix C(A.size(), std::vector<long double>(A[0].size(), 0.0));

    if (is_valid(A, B) == 0) return C;

    for (int i = 0; i < A.size(); i++) {
        for (int j = 0; j < A[0].size(); j++) {
            C[i][j] = A[i][j] - B[i][j];
        }
    }
    return C;
}

Matrix transpose(Matrix &A) {

    Matrix B(A[0].size(), std::vector<long double>(A.size(), 0.0));

    for (int i = 0; i < A.size(); i++)
        for (int j = 0; j < A[0].size(); j++) {
            B[j][i] = A[i][j];
        }
    return B;
}

long double get_determinant(Matrix &A) {
    long double det = 0.0;
    if (A.size() == 1) return A[0][0];
    if (A.size() == 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
    for (int i = 0; i < A.size(); i++) {
        std::vector<std::vector<long double>> B(A.size() - 1, std::vector<long double>(A.size() - 1, 0.0));
        for (int j = 1; j < A.size(); j++) {
            int k = 0;
            for (int l = 0; l < A.size(); l++) {
                if (l == i) continue;
                B[j - 1][k] = A[j][l];
                k++;
            }
        }
        det += pow(-1.0, i + 2) * A[0][i] * get_determinant(B);
    }
    return det;
}

long double minor(Matrix &A) {
    long double minor = 0.0;
    for (int i = 0; i < A.size(); i++) {
        for (int j = 0; j < A[0].size(); j++) {
            std::vector<std::vector<long double>> B(A.size() - 1, std::vector<long double>(A.size() - 1, 0.0));
            for (int k = 0; k < A.size(); k++) {
                for (int l = 0; l < A[0].size(); l++) {
                    if (k == i || l == j) continue;
                    B[k - 1][l - 1] = A[k][l];
                }
            }
            minor = get_determinant(B) * pow(-1.0, i + j + 2);
        }
    }
    return minor;
}


Matrix multiply(Matrix &A, Matrix &B) {
    if (A.empty() || B.empty() || A[0].size() != B.size()) {
        std::cerr << "Размеры несовместимы для умножения A(m×k) * B(k×n)" << std::endl;
    }
    int m = (int) A.size();
    int k = (int) A[0].size();
    int n = (int) B[0].size();

    Matrix C(m, std::vector<long double>(n, 0.0L));
    for (int i = 0; i < m; ++i) {
        for (int j = 0; j < n; ++j) {
            long double s = 0.0L;
            for (int t = 0; t < k; ++t) s += A[i][t] * B[t][j];
            C[i][j] = s;
        }
    }
    return C;
}


Matrix multiply(Matrix &A, long double b) {

    for (int i = 0; i < A.size(); i++) {
        for (int j = 0; j < A[0].size(); j++) {
            A[i][j] *= b;
        }
    }
    return A;
}

Matrix identity(int n) {
    Matrix I(n, std::vector<long double>(n, 0.0L));
    for (int i = 0; i < n; i++) I[i][i] = 1.0L;
    return I;
}


Matrix inverse(Matrix &A) {

    int n = A.size();
    Matrix I = identity(n);

    for (int i = 0; i < n; i++) {
        long double maxEl = fabsl(A[i][i]);
        int pivot = i;
        for (int k = i + 1; k < n; k++) {
            if (fabsl(A[k][i]) > maxEl) {
                maxEl = fabsl(A[k][i]);
                pivot = k;
            }
        }
        if (maxEl < 1e-18L) std::cerr << ("Матрица вырождена, обратной не существует");
        swap(A[i], A[pivot]);
        swap(I[i], I[pivot]);
        long double diag = A[i][i];
        for (int j = 0; j < n; j++) {
            A[i][j] /= diag;
            I[i][j] /= diag;
        }
        for (int k = 0; k < n; k++) {
            if (k == i) continue;
            long double factor = A[k][i];
            for (int j = 0; j < n; j++) {
                A[k][j] -= factor * A[i][j];
                I[k][j] -= factor * I[i][j];
            }
        }
    }
    return I;
}


Matrix power(Matrix base, long long exp) {

    int n = base.size();

    if (exp == 0) return identity(n);

    if (exp < 0) {
        base = inverse(base);
        exp = -exp;
    }
    Matrix result = identity(n);
    while (exp > 0) {
        if (exp & 1) result = multiply(result, base);
        base = multiply(base, base);
        exp >>= 1;
    }
    return result;
}